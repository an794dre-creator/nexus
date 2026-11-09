"""Dados do Maranhão para o NEXUS: combustíveis (ANP), ICMS (Tesouro/SICONFI), desemprego (IBGE),
atividade econômica do Nordeste (BCB) e tarifa de energia (ANEEL).

Os últimos dados bons ficam em web/data/maranhao_cache.json: se uma fonte falhar (ou não responder a
servidores fora do Brasil), o app continua mostrando o último valor, com a data dele.
"""
from __future__ import annotations

import io
import json
import re
import urllib.parse
import xml.etree.ElementTree as ET
import zipfile
from datetime import date, datetime, timedelta, timezone
from typing import Callable

ANP_BASE = ("https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/"
            "precos-revenda-e-de-distribuicao-combustiveis/shlp/semanal/")
ANP_PRODUCTS = {"OLEO DIESEL S10": "diesel_s10", "OLEO DIESEL": "diesel", "GASOLINA COMUM": "gasolina",
                "ETANOL HIDRATADO": "etanol", "GLP": "glp"}
ANP_CITIES = {"SAO LUIS": "slz", "IMPERATRIZ": "imp"}
ANP_REFRESH_DAYS = 3          # o arquivo de municípios tem ~9 MB: não precisa baixar toda hora
ANEEL_RESOURCE = "fcf2906c-7c32-4b9b-a637-054e7a5234f4"
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def _col(ref: str) -> int:
    n = 0
    for ch in re.match(r"[A-Z]+", ref).group(0):
        n = n * 26 + ord(ch) - 64
    return n - 1


def _excel_date(v: str) -> str:
    return (date(1899, 12, 30) + timedelta(days=int(float(v)))).isoformat()


def read_xlsx_rows(raw: bytes, keep: Callable[[list[str]], bool] | None = None):
    """Lê a primeira aba de um .xlsx só com a biblioteca padrão. Devolve (cabeçalho, linhas filtradas)."""
    z = zipfile.ZipFile(io.BytesIO(raw))
    strings = []
    if "xl/sharedStrings.xml" in z.namelist():
        for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS):
            strings.append("".join(t.text or "" for t in si.iter("{%s}t" % NS["m"])))
    sheet = sorted(n for n in z.namelist() if n.startswith("xl/worksheets/sheet"))[0]
    header, rows = None, []
    with z.open(sheet) as fh:
        for _, el in ET.iterparse(fh, events=("end",)):
            if el.tag != "{%s}row" % NS["m"]:
                continue
            vals: dict[int, str] = {}
            for c in el.findall("m:c", NS):
                v = c.find("m:v", NS)
                if v is None:
                    continue
                vals[_col(c.get("r"))] = strings[int(v.text)] if c.get("t") == "s" else v.text
            el.clear()
            row = [vals.get(i, "") for i in range(max(vals) + 1)] if vals else []
            if header is None:
                if "DATA INICIAL" in row:
                    header = row
                continue
            if row and (keep is None or keep(row)):
                rows.append(row)
    return header or [], rows


def collect_anp(fetch, cache: dict, log) -> dict:
    """Preço médio de revenda por semana: São Luís, Imperatriz (municípios) e Brasil."""
    old = cache.get("combustiveis") or {}
    if old.get("fetched") and datetime.fromisoformat(old["fetched"]) > datetime.now(timezone.utc) - timedelta(days=ANP_REFRESH_DAYS):
        log("  · ANP: dados recentes guardados (atualiza a cada 3 dias)")
        return old
    year = datetime.now(timezone.utc).year
    out = {"cidades": {}, "brasil": {}, "fetched": datetime.now(timezone.utc).isoformat()}
    try:
        raw = fetch(ANP_BASE + f"semanal-municipios-{year}.xlsx", 180)
        header, rows = read_xlsx_rows(raw, lambda r: "MARANHAO" in r and any(c in r for c in ANP_CITIES))
        h = {k: i for i, k in enumerate(header)}
        for r in rows:
            city, prod = ANP_CITIES.get(r[h["MUNICÍPIO"]]), ANP_PRODUCTS.get(r[h["PRODUTO"]])
            if city and prod:
                out["cidades"].setdefault(city, {}).setdefault(prod, []).append(
                    [_excel_date(r[h["DATA FINAL"]]), round(float(r[h["PREÇO MÉDIO REVENDA"]]), 3), r[h["UNIDADE DE MEDIDA"]]])
        raw = fetch(ANP_BASE + "semanal-brasil-desde-2013.xlsx", 120)
        header, rows = read_xlsx_rows(raw)
        h = {k: i for i, k in enumerate(header)}
        for r in rows:
            prod = ANP_PRODUCTS.get(r[h["PRODUTO"]]) if len(r) > h["PRODUTO"] else None
            if prod:
                out["brasil"].setdefault(prod, []).append(
                    [_excel_date(r[h["DATA FINAL"]]), round(float(r[h["PREÇO MÉDIO REVENDA"]]), 3), r[h["UNIDADE DE MEDIDA"]]])
        for grp in [*out["cidades"].values(), out["brasil"]]:
            for k in grp:
                grp[k] = sorted(grp[k])[-60:]   # ~1 ano de semanas
        last = out["cidades"].get("slz", {}).get("diesel_s10", [["?"]])[-1][0]
        log(f"  ✓ ANP: combustíveis de São Luís, Imperatriz e Brasil até {last}")
        return out
    except Exception as e:  # noqa: BLE001
        log(f"  ✗ ANP: {type(e).__name__}: {e}; usando os últimos dados guardados")
        return old


def collect_icms(fetch_json, log) -> dict:
    """ICMS mensal do MA (RREO, anexo 3): o último bimestre publicado traz os 12 meses anteriores."""
    year = datetime.now(timezone.utc).year
    for ano in (year, year - 1):
        for per in range(6, 0, -1):
            url = ("https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo?" + urllib.parse.urlencode({
                "an_exercicio": ano, "nr_periodo": per, "co_tipo_demonstrativo": "RREO",
                "no_anexo": "RREO-Anexo 03", "co_esfera": "E", "id_ente": 21}))
            try:
                items = [i for i in fetch_json(url)["items"] if i["conta"].strip().upper() == "ICMS"]
            except Exception as e:  # noqa: BLE001
                log(f"  ✗ ICMS: {type(e).__name__}: {e}")
                return {}
            if not items:
                continue
            col = {i["coluna"]: float(i["valor"]) for i in items}
            end = date(ano, per * 2, 1)    # último mês do bimestre
            months = []
            for k in range(11, -1, -1):
                key = "<MR>" if k == 0 else f"<MR-{k}>"
                y, m = end.year, end.month - k
                while m <= 0:
                    y, m = y - 1, m + 12
                if key in col:
                    months.append([f"{y}-{m:02d}", round(col[key] / 1e6, 1)])   # R$ milhões
            log(f"  ✓ ICMS MA: 12 meses até {months[-1][0]} (bimestre {per}/{ano})")
            return {"meses": months, "total12": round(col.get("TOTAL (ÚLTIMOS 12 MESES)", 0) / 1e9, 2),
                    "previsao": round(col.get(f"PREVISÃO ATUALIZADA {ano}", 0) / 1e9, 2), "ano": ano, "bimestre": per,
                    "fonte": "Tesouro Nacional · SICONFI (RREO, anexo 3)"}
    return {}


def collect_desemprego(fetch_json, log) -> dict:
    """Taxa de desocupação trimestral (PNAD Contínua, tabela 4099): Maranhão e Brasil."""
    out = {}
    for key, loc in (("ma", "n3/21"), ("br", "n1/all")):
        try:
            rows = fetch_json(f"https://apisidra.ibge.gov.br/values/t/4099/{loc}/v/4099/p/last%2012")[1:]
            out[key] = [[f"{r['D3C'][5:]}T/{r['D3C'][:4]}", float(r["V"])] for r in rows if r["V"] not in ("-", "...", "X")]
        except Exception as e:  # noqa: BLE001
            log(f"  ✗ Desemprego {key}: {type(e).__name__}: {e}")
    if out:
        log(f"  ✓ Desemprego: MA {out.get('ma', [[0, '?']])[-1][1]}% · BR {out.get('br', [[0, '?']])[-1][1]}%")
    return out


def collect_ibcr(fetch_json, log) -> list:
    """Índice de Atividade Econômica Regional do Nordeste (IBCR-NE, BCB SGS 25391)."""
    ini = (datetime.now(timezone.utc) - timedelta(days=4 * 365)).strftime("%d/%m/%Y")
    fim = datetime.now(timezone.utc).strftime("%d/%m/%Y")
    try:
        rows = fetch_json(f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.25391/dados?formato=json&dataInicial={ini}&dataFinal={fim}")
        pts = [[f"{r['data'][6:]}-{r['data'][3:5]}", float(r["valor"])] for r in rows]
        log(f"  ✓ IBCR-NE: {len(pts)} meses até {pts[-1][0]}")
        return pts
    except Exception as e:  # noqa: BLE001
        log(f"  ✗ IBCR-NE: {type(e).__name__}: {e}")
        return []


def collect_energia(fetch_json, log) -> dict:
    """Tarifa de aplicação da Equatorial Maranhão (sem tributos), residencial B1 e comercial B3, em R$/kWh."""
    out = {}
    for key, sub, classe, subclasse in (("residencial", "B1", "Residencial", "Residencial"),
                                         ("comercial", "B3", "Comercial, Serviços e Outras", None)):
        filt = {"SigAgente": "EQUATORIAL MA", "DscBaseTarifaria": "Tarifa de Aplicação", "DscSubGrupo": sub,
                "DscModalidadeTarifaria": "Convencional", "DscUnidadeTerciaria": "MWh", "DscDetalhe": "Não se aplica"}
        url = ("https://dadosabertos.aneel.gov.br/api/3/action/datastore_search?" + urllib.parse.urlencode({
            "resource_id": ANEEL_RESOURCE, "limit": 200, "sort": "DatInicioVigencia desc", "filters": json.dumps(filt)}))
        try:
            recs = fetch_json(url)["result"]["records"]
        except Exception as e:  # noqa: BLE001
            log(f"  ✗ ANEEL {key}: {type(e).__name__}: {e}")
            continue
        num = lambda s: float(str(s).replace(".", "").replace(",", ".")) if s not in (None, "") else 0.0  # noqa: E731
        seen, pts = set(), []
        for r in recs:
            if r["DscClasse"] != classe and not r["DscClasse"].startswith(classe.split(",")[0]):
                continue
            if subclasse and r["DscSubClasse"] != subclasse:
                continue
            if r["DatInicioVigencia"] in seen:
                continue
            seen.add(r["DatInicioVigencia"])
            pts.append([r["DatInicioVigencia"], round((num(r["VlrTUSD"]) + num(r["VlrTE"])) / 1000, 4)])
        pts = sorted(pts)[-8:]
        if pts:
            out[key] = pts
            log(f"  ✓ ANEEL {key}: R$ {pts[-1][1]:.3f}/kWh desde {pts[-1][0]}")
    return out


def collect_maranhao(fetch, fetch_json, data_dir, log) -> dict:
    path = data_dir / "maranhao_cache.json"
    cache = json.loads(path.read_text("utf-8")) if path.exists() else {}
    fresh = {
        "combustiveis": collect_anp(fetch, cache, log),
        "icms": collect_icms(fetch_json, log),
        "desemprego": collect_desemprego(fetch_json, log),
        "ibcr_ne": collect_ibcr(fetch_json, log),
        "energia": collect_energia(fetch_json, log),
    }
    for k, v in fresh.items():   # o que falhou fica com o último valor bom
        if v:
            cache[k] = v
    cache["updated"] = datetime.now(timezone.utc).isoformat()
    path.write_text(json.dumps(cache, ensure_ascii=False, separators=(",", ":")), "utf-8")
    return cache
