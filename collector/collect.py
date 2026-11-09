"""Coletor do NEXUS.

Busca notícias (RSS), indicadores (BCB, Yahoo, CoinGecko), expectativas (Focus)
e papers (arXiv), e grava tudo em web/data/ como JSON para o app ler.

Só usa a biblioteca padrão do Python. Uso:
    py collector/collect.py            # coleta tudo
    py collector/collect.py --only rss # só uma parte (rss, bcb, focus, yahoo, crypto, arxiv)
"""
from __future__ import annotations

import argparse
import gzip
import hashlib
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import config as C  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "web" / "data"
ARCHIVE = DATA / "archive"
UA = "Mozilla/5.0 (compatible; NEXUS-coletor/0.1)"
NOW = datetime.now(timezone.utc)
LOG: list[str] = []


def log(msg: str) -> None:
    LOG.append(msg)
    print(msg, flush=True)


def fetch(url: str, timeout: int = 25, accept: str = "*/*", tries: int = 2) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": accept})
    for attempt in range(tries):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                raw = r.read()
            break
        except urllib.error.HTTPError:
            raise  # erro do servidor (404, 410...): não adianta repetir
        except Exception:  # noqa: BLE001  falha de rede passageira: tenta de novo
            if attempt == tries - 1:
                raise
            time.sleep(2)
    if raw[:2] == b"\x1f\x8b":  # alguns servidores mandam gzip mesmo sem pedirmos
        raw = gzip.decompress(raw)
    return raw.lstrip(b"\xef\xbb\xbf \r\n\t")


def fetch_json(url: str, timeout: int = 25):
    return json.loads(fetch(url, timeout, "application/json").decode("utf-8"))


def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ---------------------------------------------------------------------------
# RSS
# ---------------------------------------------------------------------------
TAG_RE = re.compile(r"<[^>]+>")
WS_RE = re.compile(r"\s+")


BOILER_RE = re.compile(
    r"(O post .{0,300}? apareceu primeiro em .{0,80}?\.?$|The post .{0,300}? appeared first on .{0,80}?\.?$"
    r"|Leia mais \(\d\d/\d\d/\d{4} - \d\dh\d\d\)$|Continue reading.*$|Read more.*$|\[…\]$|\[\.\.\.\]$)",
    re.I | re.S)


def clean(text: str | None, limit: int = 320) -> str:
    if not text:
        return ""
    t = html.unescape(TAG_RE.sub(" ", text))
    t = WS_RE.sub(" ", t).strip()
    t = BOILER_RE.sub("", t).strip()
    return (t[: limit - 1].rsplit(" ", 1)[0] + "…") if len(t) > limit else t


def parse_date(s: str | None) -> datetime | None:
    if not s:
        return None
    s = s.strip()
    try:
        d = parsedate_to_datetime(s)
        return d if d.tzinfo else d.replace(tzinfo=timezone.utc)
    except Exception:
        pass
    try:
        d = datetime.fromisoformat(s.replace("Z", "+00:00"))
        return d if d.tzinfo else d.replace(tzinfo=timezone.utc)
    except Exception:
        return None


def local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def child_text(el, *names):
    for c in el:
        if local(c.tag) in names and (c.text or "").strip():
            return c.text
    return None


def parse_feed(raw: bytes):
    root = ET.fromstring(raw)
    out = []
    for el in root.iter():
        name = local(el.tag)
        if name not in ("item", "entry"):
            continue
        title = clean(child_text(el, "title"), 220)
        link = None
        for c in el:
            if local(c.tag) == "link":
                link = c.get("href") or (c.text or "").strip() or link
                if c.get("rel") in (None, "alternate") and link:
                    break
        summary = child_text(el, "description", "summary", "content", "encoded")
        date = parse_date(child_text(el, "pubDate", "published", "updated", "date"))
        if title and link:
            out.append({"title": title, "link": link.strip(), "summary": clean(summary), "date": date})
    return out


AREA_RES = [(a, re.compile(rx, re.I)) for a, rx in C.AREA_RULES]
ECON_RE = re.compile(C.ECON_FILTER, re.I)
ECON_NO = re.compile(C.ECON_EXCLUDE, re.I)
TECH_RE = re.compile(C.TECH_BIZ, re.I)
BOOST_RE = re.compile(C.BOOST, re.I)


def classify(text: str, default: str) -> str:
    for area, rx in AREA_RES:
        if rx.search(text):
            return area
    return default


def is_econ(item: dict) -> bool:
    """A notícia tem cara de economia, negócios, mercado ou política econômica? Decide pelo título."""
    t = item["title"]
    if ECON_NO.search(t):
        return False
    if BOOST_RE.search(t) or ECON_RE.search(t):
        return True
    if item["area"] in ("ia", "cripto") and TECH_RE.search(t):
        return True
    if item["area"] == "agro" or item["kind"] == "prim":
        return True
    return len(BOOST_RE.findall(item["summary"])) >= 2  # resumo bem econômico mesmo com título vago


def score(item: dict) -> float:
    s = 2.0 if item["kind"] == "prim" else 1.0
    s += min(len(BOOST_RE.findall(item["title"] + " " + item["summary"])), 3)
    if not is_econ(item):
        s -= 2.0  # curiosidades e variedades não sobem para os destaques
    age_h = (NOW - datetime.fromisoformat(item["published"].replace("Z", "+00:00"))).total_seconds() / 3600
    s += max(0.0, 3.0 - age_h / 12)  # até +3 para itens das últimas horas, zera em 36 h
    if age_h > 48:
        s -= 1.0
    return round(s, 2)


def collect_rss() -> list[dict]:
    items = []
    for f in C.FEEDS:
        try:
            entries = parse_feed(fetch(f["url"]))
        except Exception as e:  # noqa: BLE001
            log(f"  ✗ {f['name']}: {type(e).__name__}: {e}")
            continue
        n = 0
        for e in entries:
            if n >= C.MAX_PER_FEED:
                break
            d = e["date"] or NOW
            if d > NOW + timedelta(hours=2) or NOW - d > timedelta(hours=C.WINDOW_HOURS):
                continue
            text = e["title"] + " " + e["summary"]
            if f.get("filter") == "ECON" and (not ECON_RE.search(e["title"]) or ECON_NO.search(e["title"])):
                continue  # feed generalista: só entra o que for de economia
            it = {
                "id": hashlib.sha1(e["link"].encode()).hexdigest()[:16],
                "title": e["title"],
                "link": e["link"],
                "summary": e["summary"],
                "source": f["name"],
                "kind": f["kind"],
                "area": classify(text, f["area"]),
                "published": iso(d),
            }
            it["score"] = score(it)
            it["econ"] = is_econ(it)
            items.append(it)
            n += 1
        log(f"  ✓ {f['name']}: {n} itens recentes (de {len(entries)})")
    # remove duplicados (mesmo link ou mesmo título)
    seen, uniq = set(), []
    for it in sorted(items, key=lambda x: x["published"], reverse=True):
        key = (it["id"], it["title"].lower())
        if key[0] in seen or key[1] in seen:
            continue
        seen.update(key)
        uniq.append(it)
    return uniq[: C.MAX_ITEMS]


# ---------------------------------------------------------------------------
# Banco Central (SGS) e Focus
# ---------------------------------------------------------------------------
def sgs(code: int, days: int):
    """Série do SGS por intervalo de datas (a consulta 'últimos N' foi limitada pelo BCB)."""
    ini = (NOW - timedelta(days=days)).strftime("%d/%m/%Y")
    fim = NOW.strftime("%d/%m/%Y")
    url = f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{code}/dados?formato=json&dataInicial={ini}&dataFinal={fim}"
    rows = fetch_json(url)
    today = NOW.date()
    out = []
    for r in rows:
        d = datetime.strptime(r["data"], "%d/%m/%Y").date()
        if d <= today:  # a série da Selic meta vem preenchida até a próxima reunião
            out.append((r["data"], float(r["valor"])))
    return out


def change(vals: list[float], kind: str):
    if len(vals) < 2:
        return 0.0
    a, b = vals[-2], vals[-1]
    if kind == "pp":
        return round(b - a, 2)
    return round((b / a - 1) * 100, 2) if a else 0.0


def last_change(vals: list[float], kind: str):
    """Variação desde o último valor diferente (útil para Selic, que fica parada)."""
    if kind == "pp":
        for v in reversed(vals[:-1]):
            if v != vals[-1]:
                return round(vals[-1] - v, 2)
        return 0.0
    return change(vals, kind)


def indicator(id_, name, group, value, unit, delta, delta_kind, series, dates, src, extra=None):
    d = {
        "id": id_, "name": name, "group": group, "value": value, "unit": unit,
        "delta": delta, "delta_kind": delta_kind,
        "dir": "up" if delta > 0 else "down" if delta < 0 else "flat",
        "series": [round(v, 6) for v in series], "dates": dates, "src": src,
        "as_of": dates[-1] if dates else None,
    }
    if extra:
        d.update(extra)
    return d


def collect_bcb() -> list[dict]:
    out = []
    for s in C.BCB_SERIES:
        try:
            rows = sgs(s["code"], s["days"])
            vals = [v for _, v in rows]
            dates = [d for d, _ in rows]
            extra = None
            if s["id"] == "selic":  # série diária longa: reduz para ~60 pontos
                step = max(1, len(vals) // 60)
                vals_s, dates_s = vals[::step] + [vals[-1]], dates[::step] + [dates[-1]]
                delta = change(vals, "pp")
                lc = last_change(vals, "pp")
                if lc:
                    extra = {"note": f"última mudança: {'+' if lc > 0 else '−'}{abs(lc):.2f} p.p.".replace(".", ",", 1).replace("p,p", "p.p")}
            else:
                vals_s, dates_s = vals[-30:], dates[-30:]
                delta = change(vals, s["delta"])
            out.append(indicator(s["id"], s["name"], s["group"], vals[-1], s["unit"], delta, s["delta"], vals_s, dates_s, s["src"], extra))
            log(f"  ✓ BCB {s['name']}: {vals[-1]} ({dates[-1]})")
        except Exception as e:  # noqa: BLE001
            log(f"  ✗ BCB {s['name']}: {type(e).__name__}: {e}")
    # IGP-M 12 meses a partir das variações mensais
    try:
        rows = sgs(C.IGPM_CODE, 1100)
        acc, dates = [], []
        for i in range(11, len(rows)):
            p = 1.0
            for _, v in rows[i - 11 : i + 1]:
                p *= 1 + v / 100
            acc.append(round((p - 1) * 100, 2))
            dates.append(rows[i][0])
        out.append(indicator("igpm12", "IGP-M 12 meses", "brasil", acc[-1], "%", change(acc, "pp"), "pp", acc, dates, "BCB · SGS 189 (calculado)"))
        log(f"  ✓ BCB IGP-M 12m: {acc[-1]}")
    except Exception as e:  # noqa: BLE001
        log(f"  ✗ BCB IGP-M: {type(e).__name__}: {e}")
    return out


def collect_focus() -> dict:
    base = "https://olinda.bcb.gov.br/olinda/servico/Expectativas/versao/v1/odata/ExpectativasMercadoAnuais"
    year = NOW.year
    out = {"years": [year, year + 1], "rows": [], "date": None}
    for ind in C.FOCUS_INDICATORS:
        try:
            flt = f"Indicador eq '{ind}' and baseCalculo eq 0"
            q = urllib.parse.urlencode({"$top": 60, "$filter": flt, "$orderby": "Data desc", "$format": "json",
                                        "$select": "Indicador,Data,DataReferencia,Mediana"}, quote_via=urllib.parse.quote)
            rows = fetch_json(f"{base}?{q}")["value"]
            if not rows:
                raise ValueError("sem dados")
            latest = rows[0]["Data"]
            dates = sorted({r["Data"] for r in rows}, reverse=True)
            prev_date = dates[4] if len(dates) > 4 else dates[-1]  # ~4 semanas antes
            def med(date, ref):
                for r in rows:
                    if r["Data"] == date and str(r["DataReferencia"]) == str(ref):
                        return r["Mediana"]
                return None
            out["rows"].append({
                "name": ind,
                "now": [med(latest, year), med(latest, year + 1)],
                "prev": [med(prev_date, year), med(prev_date, year + 1)],
            })
            out["date"] = latest
            log(f"  ✓ Focus {ind}: {out['rows'][-1]['now']} em {latest}")
        except Exception as e:  # noqa: BLE001
            log(f"  ✗ Focus {ind}: {type(e).__name__}: {e}")
    return out


# ---------------------------------------------------------------------------
# Yahoo Finance (cotações)
# ---------------------------------------------------------------------------
def collect_yahoo() -> list[dict]:
    out = []
    for y in C.YAHOO:
        try:
            sym = urllib.parse.quote(y["sym"])
            j = fetch_json(f"https://query1.finance.yahoo.com/v8/finance/chart/{sym}?range=3mo&interval=1d")
            r = j["chart"]["result"][0]
            closes = r["indicators"]["quote"][0]["close"]
            ts = r["timestamp"]
            pts = [(t, c) for t, c in zip(ts, closes) if c is not None]
            meta = r.get("meta", {})
            price = meta.get("regularMarketPrice") or pts[-1][1]
            prev = meta.get("chartPreviousClose") if len(pts) < 2 else pts[-2][1]
            if pts and abs(pts[-1][1] - price) > 1e-9 and datetime.fromtimestamp(pts[-1][0], timezone.utc).date() == NOW.date():
                pts[-1] = (pts[-1][0], price)
            vals = [c for _, c in pts][-60:]
            dates = [datetime.fromtimestamp(t, timezone.utc).strftime("%d/%m/%Y") for t, _ in pts][-60:]
            dk = y.get("delta", "pct")
            delta = round(vals[-1] - vals[-2], 3) if dk == "pp" else round((vals[-1] / vals[-2] - 1) * 100, 2)
            out.append(indicator(y["id"], y["name"], y["group"], vals[-1], "", delta, dk, vals, dates, "Yahoo Finance",
                                 {"fmt": y["fmt"], "prefix": y.get("prefix", ""), "suffix": y.get("suffix", "")}))
            log(f"  ✓ Yahoo {y['name']}: {vals[-1]:.2f}")
            time.sleep(0.3)
        except Exception as e:  # noqa: BLE001
            log(f"  ✗ Yahoo {y['name']}: {type(e).__name__}: {e}")
    return out


# ---------------------------------------------------------------------------
# Cripto (CoinGecko)
# ---------------------------------------------------------------------------
def collect_crypto() -> list[dict]:
    out = []
    ids = ",".join(c["cg"] for c in C.COINS)
    try:
        prices = fetch_json(f"https://api.coingecko.com/api/v3/simple/price?ids={ids}&vs_currencies=usd,brl&include_24hr_change=true")
    except Exception as e:  # noqa: BLE001
        log(f"  ✗ CoinGecko preços: {type(e).__name__}: {e}")
        return out
    for c in C.COINS:
        p = prices.get(c["cg"])
        if not p:
            continue
        series, dates = [], []
        try:
            time.sleep(1.5)
            mc = fetch_json(f"https://api.coingecko.com/api/v3/coins/{c['cg']}/market_chart?vs_currency=usd&days=90&interval=daily")
            series = [v for _, v in mc["prices"]]
            dates = [datetime.fromtimestamp(t / 1000, timezone.utc).strftime("%d/%m/%Y") for t, _ in mc["prices"]]
        except Exception as e:  # noqa: BLE001
            log(f"  ✗ CoinGecko histórico {c['name']}: {type(e).__name__}: {e}")
        out.append(indicator(c["id"], c["name"], "cripto", p["usd"], "US$", round(p.get("usd_24h_change") or 0, 2), "pct",
                             series or [p["usd"]], dates or [NOW.strftime("%d/%m/%Y")], "CoinGecko · 24h",
                             {"fmt": "int" if p["usd"] > 1000 else "2", "prefix": "US$ ", "brl": p.get("brl")}))
        log(f"  ✓ CoinGecko {c['name']}: US$ {p['usd']}")
    try:
        g = fetch_json("https://api.coingecko.com/api/v3/global")["data"]
        dom = round(g["market_cap_percentage"]["btc"], 1)
        total = g["total_market_cap"]["usd"] / 1e12
        out.append(indicator("btcdom", "Dominância do bitcoin", "cripto", dom, "%", 0, "pp", [dom], [NOW.strftime("%d/%m/%Y")], "CoinGecko",
                             {"fmt": "pct1"}))
        out.append(indicator("cryptocap", "Valor total do mercado cripto", "cripto", round(total, 2), "", round(g.get("market_cap_change_percentage_24h_usd") or 0, 2), "pct",
                             [round(total, 2)], [NOW.strftime("%d/%m/%Y")], "CoinGecko", {"fmt": "tri"}))
        log(f"  ✓ CoinGecko global: dominância {dom}%")
    except Exception as e:  # noqa: BLE001
        log(f"  ✗ CoinGecko global: {type(e).__name__}: {e}")
    return out


# ---------------------------------------------------------------------------
# arXiv
# ---------------------------------------------------------------------------
def collect_arxiv() -> list[dict]:
    q = urllib.parse.urlencode({"search_query": C.ARXIV_QUERY, "sortBy": "submittedDate", "sortOrder": "descending",
                                "max_results": C.ARXIV_MAX})
    try:
        root = ET.fromstring(fetch(f"https://export.arxiv.org/api/query?{q}", 40))
    except Exception as e:  # noqa: BLE001
        log(f"  ✗ arXiv: {type(e).__name__}: {e}")
        return []
    ns = {"a": "http://www.w3.org/2005/Atom", "arxiv": "http://arxiv.org/schemas/atom"}
    out = []
    for e in root.findall("a:entry", ns):
        cat = e.find("arxiv:primary_category", ns)
        out.append({
            "id": (e.findtext("a:id", "", ns) or "").rsplit("/", 1)[-1],
            "title": clean(e.findtext("a:title", "", ns), 240),
            "summary": clean(e.findtext("a:summary", "", ns), 400),
            "authors": [clean(a.findtext("a:name", "", ns)) for a in e.findall("a:author", ns)][:4],
            "cat": cat.get("term") if cat is not None else "",
            "link": e.findtext("a:id", "", ns),
            "published": e.findtext("a:published", "", ns),
        })
    log(f"  ✓ arXiv: {len(out)} papers")
    return out


def collect_papers() -> list[dict]:
    out = collect_arxiv()
    try:
        nber = parse_feed(fetch(C.NBER_FEED))
        for e in nber[:20]:
            out.append({"id": e["link"].rstrip("/").rsplit("/", 1)[-1], "title": e["title"], "summary": e["summary"],
                        "authors": [], "cat": "NBER", "link": e["link"], "published": iso(e["date"]) if e["date"] else ""})
        log(f"  ✓ NBER: {min(len(nber), 20)} working papers")
    except Exception as e:  # noqa: BLE001
        log(f"  ✗ NBER: {type(e).__name__}: {e}")
    return out


# ---------------------------------------------------------------------------
# Arquivo histórico (base para tendências)
# ---------------------------------------------------------------------------
def update_archive(items: list[dict]) -> int:
    ARCHIVE.mkdir(parents=True, exist_ok=True)
    added = 0
    by_month: dict[str, list[dict]] = {}
    for it in items:
        by_month.setdefault(it["published"][:7], []).append(it)
    for month, its in by_month.items():
        path = ARCHIVE / f"{month}.json"
        cur = json.loads(path.read_text("utf-8")) if path.exists() else []
        ids = {x["id"] for x in cur}
        for it in its:
            if it["id"] not in ids:
                cur.append({k: it[k] for k in ("id", "title", "area", "source", "kind", "published", "link")})
                ids.add(it["id"])
                added += 1
        cur.sort(key=lambda x: x["published"])
        path.write_text(json.dumps(cur, ensure_ascii=False, separators=(",", ":")), "utf-8")
    # índice dos meses disponíveis
    months = sorted(p.stem for p in ARCHIVE.glob("*.json") if p.stem != "index")
    (ARCHIVE / "index.json").write_text(json.dumps(months), "utf-8")
    return added


# ---------------------------------------------------------------------------
def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", choices=["rss", "bcb", "focus", "yahoo", "crypto", "arxiv"])
    ap.add_argument("--archive", action="store_true", help="grava o histórico também numa execução local")
    args = ap.parse_args()
    DATA.mkdir(parents=True, exist_ok=True)
    path = DATA / "latest.json"
    prev = json.loads(path.read_text("utf-8")) if path.exists() else {}
    ind_prev = {i["id"]: i for i in prev.get("indicators", [])}

    def want(part):
        return args.only in (None, part)

    out = dict(prev)
    if want("rss"):
        log("RSS")
        items = collect_rss()
        if items:
            out["items"] = items
            # o histórico só é gravado no GitHub Actions (ou com --archive), para não conflitar com o repositório
            if os.environ.get("GITHUB_ACTIONS") or args.archive:
                log(f"  arquivo: +{update_archive(items)} itens novos")
    indicators = dict(ind_prev)
    for part, fn in (("bcb", collect_bcb), ("yahoo", collect_yahoo), ("crypto", collect_crypto)):
        if want(part):
            log(part.upper())
            for i in fn():
                indicators[i["id"]] = i  # se uma fonte falhar, mantém o último valor bom
    out["indicators"] = list(indicators.values())
    if want("focus"):
        log("FOCUS")
        f = collect_focus()
        if f["rows"]:
            out["focus"] = f
    if want("arxiv"):
        log("ARXIV")
        p = collect_papers()
        if p:
            out["papers"] = p
    out["updated_at"] = iso(NOW)
    out["log"] = [l for l in LOG if "✗" in l]
    path.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), "utf-8")
    log(f"OK · {len(out.get('items', []))} itens · {len(out['indicators'])} indicadores · gravado em {path}")


if __name__ == "__main__":
    main()
