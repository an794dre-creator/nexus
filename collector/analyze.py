"""Análises com IA do NEXUS (versão 2).

Roda depois de collect.py, no GitHub Actions:
  1. escolhe os destaques do momento (mesma regra do app);
  2. gera, para os que ainda não têm, uma análise em 7 blocos ligada aos conceitos do curso;
  3. uma vez por dia, gera a edição do dia.

Grava em web/data/analyses.json e web/data/edition.json.
Sem a variável ANTHROPIC_API_KEY, não faz nada (o app continua funcionando sem IA).

Variáveis de ambiente (opcionais):
  NEXUS_MODEL          modelo do Claude (padrão: claude-opus-5-5)
  NEXUS_EFFORT         low | medium | high (padrão: low)
  NEXUS_MAX_PER_RUN    análises por execução (padrão: 4)
  NEXUS_MAX_PER_DAY    análises por dia (padrão: 20)

Uso local:  py collector/analyze.py --dry-run   (mostra o que seria analisado, sem chamar a API)
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "web" / "data"
CONTENT_JS = ROOT / "web" / "content.js"
NOW = datetime.now(timezone.utc)
BRT = timezone(timedelta(hours=-3))

MODEL = os.environ.get("NEXUS_MODEL") or "claude-opus-5-5"
EFFORT = os.environ.get("NEXUS_EFFORT") or "low"
MAX_PER_RUN = int(os.environ.get("NEXUS_MAX_PER_RUN") or 4)
MAX_PER_DAY = int(os.environ.get("NEXUS_MAX_PER_DAY") or 20)
KEEP_DAYS = 10            # análises mais antigas que isso saem do arquivo
EDITION_HOUR_BRT = 7      # a edição do dia é gerada na primeira execução a partir das 7h (Brasília)


# ---------------------------------------------------------------------------
# Formação do aluno, lida de web/content.js (fonte única da grade)
# ---------------------------------------------------------------------------
def load_formacao() -> dict:
    js = CONTENT_JS.read_text("utf-8")
    sem = re.search(r"SEMESTRE_ATUAL\s*=\s*'([^']+)'", js).group(1)
    disc = dict(re.findall(r"^\s*\['(\w+)',\s*'([^']+)',\s*'[^']+'\]", js, re.M))
    conc = [{"id": m[0], "name": m[1], "eixo": m[2]}
            for m in re.findall(r"^\s*\['(\w+)','([^']+)','(\w+)',\d,", js, re.M)]
    cursos = []
    for cod, nome, eixo, sems, cs in re.findall(r"^\s*\['([A-Z]{4}\d{4})','([^']+)','(\w+)',\[([^\]]*)\],\[([^\]]*)\]\]", js, re.M):
        cursos.append({"cod": cod, "nome": nome, "eixo": eixo,
                       "sems": re.findall(r"'([^']+)'", sems), "conc": re.findall(r"'([^']+)'", cs)})
    if not conc or not cursos:
        raise RuntimeError("não consegui ler CONC/CURSOS de web/content.js")
    return {"semestre": sem, "disc": disc, "conc": conc, "cursos": cursos}


def system_prompt(f: dict) -> str:
    """Prompt fixo (sem datas): fica em cache entre as chamadas de uma mesma execução."""
    atuais = [c for c in f["cursos"] if f["semestre"] in c["sems"]]
    conc_lines = []
    for c in f["conc"]:
        onde = [x["nome"] for x in f["cursos"] if c["id"] in x["conc"]]
        conc_lines.append(f"- {c['id']}: {c['name']} (eixo: {f['disc'].get(c['eixo'], c['eixo'])}; visto em: {', '.join(onde[:3]) or '—'})")
    return f"""Você é o analista do NEXUS, um radar pessoal de economia de um estudante de Ciências Econômicas da UFMA (São Luís, Maranhão), no semestre {f['semestre']}, já na reta final do curso.

Matérias que ele cursa agora: {'; '.join(c['nome'] for c in atuais)}.
O currículo tem peso grande de economia política, desenvolvimento (CEPAL, Furtado), setor público e economia brasileira e regional, além do núcleo de micro, macro e métodos quantitativos.

Ele também trabalha como controller e economista-chefe de uma empresa de ônibus no Maranhão. Em notícias de transporte, combustíveis, tarifas, salários, crédito, tributos ou Maranhão, use "para_voce" para o impacto prático sobre um operador de ônibus (custo por km, diesel, tarifa técnica, reajuste contratual, gratuidades, demanda, financiamento de frota), além da ligação com as matérias.

Seu trabalho: transformar uma notícia em aprendizado, em português do Brasil, com linguagem clara e direta, sem jargão desnecessário.

Regras de honestidade, as mais importantes:
- Você recebe só o título, o resumo e a fonte da notícia, não o texto completo. No bloco "fato", diga apenas o que esse material afirma, atribuindo à fonte quando for uma alegação ("segundo a empresa", "de acordo com o IBGE"). Não acrescente números, datas ou nomes que não estejam no material.
- "contexto" pode usar conhecimento geral consolidado, mas sem inventar acontecimentos recentes. Se não tiver certeza de algo recente, não afirme.
- "mecanismo" e "conexoes" são interpretação: explique a teoria econômica por trás, apontando a corrente quando fizer diferença (por exemplo, leitura ortodoxa e heterodoxa).
- "consequencias" são hipóteses: escreva cada uma como possibilidade, nunca como certeza.
- Em "limites", diga o que o material não permite concluir e o que seria preciso checar na fonte.

Formato de cada campo:
- fato: 2 a 3 frases.
- contexto: 2 a 4 frases.
- mecanismo: 3 a 5 frases, explicando a cadeia de causa e efeito.
- consequencias: 2 a 4 itens curtos.
- conexoes: ids de outras notícias da lista fornecida que tenham relação real com esta (pode ser vazia).
- acompanhar: 2 a 3 dados, decisões ou eventos concretos que confirmariam ou contrariariam a leitura.
- estudar: 1 a 3 ids de conceitos da lista abaixo, os mais úteis para entender a notícia.
- para_voce: 1 a 2 frases ligando a notícia a uma matéria que ele cursa agora (cite o nome da matéria), ao trabalho na empresa de ônibus ou ao Maranhão/Nordeste, o que for mais útil.
- limites: 1 a 2 frases.

Conceitos da formação (use só estes ids em "estudar"):
{chr(10).join(conc_lines)}
"""


def analysis_schema(concept_ids: list[str]) -> dict:
    s = {"type": "string"}
    arr = {"type": "array", "items": {"type": "string"}}
    return {
        "type": "object",
        "properties": {
            "fato": s, "contexto": s, "mecanismo": s,
            "consequencias": arr, "conexoes": arr, "acompanhar": arr,
            "estudar": {"type": "array", "items": {"type": "string", "enum": concept_ids}},
            "para_voce": s, "limites": s,
        },
        "required": ["fato", "contexto", "mecanismo", "consequencias", "conexoes", "acompanhar", "estudar", "para_voce", "limites"],
        "additionalProperties": False,
    }


def edition_schema(concept_ids: list[str]) -> dict:
    s = {"type": "string"}
    arr = {"type": "array", "items": {"type": "string"}}
    return {
        "type": "object",
        "properties": {
            "manchete": s,
            "resumo": arr,
            "acompanhar_hoje": arr,
            "pergunta_estudo": s,
            "conceito": {"type": "string", "enum": concept_ids},
            "itens": arr,
        },
        "required": ["manchete", "resumo", "acompanhar_hoje", "pergunta_estudo", "conceito", "itens"],
        "additionalProperties": False,
    }


# ---------------------------------------------------------------------------
# Seleção dos destaques (mesma regra de highlights() em web/app.js)
# ---------------------------------------------------------------------------
def highlights(items: list[dict], n: int = 9) -> list[dict]:
    out, per = [], {}
    for it in sorted(items, key=lambda x: -x.get("score", 0)):
        if per.get(it["area"], 0) >= 2:
            continue
        per[it["area"]] = per.get(it["area"], 0) + 1
        out.append(it)
        if len(out) >= n:
            break
    return out


# ---------------------------------------------------------------------------
# Chamada ao Claude
# ---------------------------------------------------------------------------
def call_claude(client, system: str, user: str, schema: dict, max_tokens: int = 4000):
    """Uma chamada com saída em JSON validado pelo esquema. Devolve (dict | None, usage)."""
    import anthropic  # noqa: F401  (importado aqui para o --dry-run não exigir o pacote)
    resp = client.beta.messages.create(
        model=MODEL,
        max_tokens=max_tokens,
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",                 # se o modelo recusar, o próprio servidor tenta o modelo indicado para o caso
        system=[{"type": "text", "text": system, "cache_control": {"type": "ephemeral"}}],
        output_config={"effort": EFFORT, "format": {"type": "json_schema", "schema": schema}},
        messages=[{"role": "user", "content": user}],
    )
    if resp.stop_reason in ("refusal", "max_tokens"):
        return None, resp.usage, resp.stop_reason
    text = next((b.text for b in resp.content if b.type == "text"), "")
    return json.loads(text), resp.usage, resp.stop_reason


def item_block(it: dict) -> str:
    when = datetime.fromisoformat(it["published"].replace("Z", "+00:00")).astimezone(BRT).strftime("%d/%m/%Y %H:%M")
    return (f"Título: {it['title']}\nResumo da fonte: {it.get('summary') or '(sem resumo)'}\n"
            f"Fonte: {it['source']} ({'fonte primária' if it['kind'] == 'prim' else 'imprensa'})\nPublicado: {when} (Brasília)\nAssunto: {it['area']}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="mostra o que seria feito, sem chamar a API")
    ap.add_argument("--force-edition", action="store_true", help="gera a edição do dia mesmo se já existir")
    args = ap.parse_args()

    latest = json.loads((DATA / "latest.json").read_text("utf-8"))
    items = latest.get("items", [])
    f = load_formacao()
    cids = [c["id"] for c in f["conc"]]
    system = system_prompt(f)

    apath, epath = DATA / "analyses.json", DATA / "edition.json"
    analyses = json.loads(apath.read_text("utf-8")) if apath.exists() else {}
    cutoff = (NOW - timedelta(days=KEEP_DAYS)).isoformat()
    analyses = {k: v for k, v in analyses.items() if v.get("created", "") >= cutoff}
    today = NOW.astimezone(BRT).strftime("%Y-%m-%d")
    done_today = sum(1 for v in analyses.values()
                     if datetime.fromisoformat(v.get("created", "1970-01-01T00:00:00+00:00")).astimezone(BRT).strftime("%Y-%m-%d") == today)

    hl = highlights(items)
    # só analisa o que é de economia (o coletor marca "econ"); itens antigos sem a marca passam
    todo = [it for it in hl if it["id"] not in analyses and it.get("econ", True)][: max(0, min(MAX_PER_RUN, MAX_PER_DAY - done_today))]
    edition = json.loads(epath.read_text("utf-8")) if epath.exists() else {}
    need_edition = args.force_edition or (edition.get("date") != today and NOW.astimezone(BRT).hour >= EDITION_HOUR_BRT)

    print(f"modelo {MODEL} · esforço {EFFORT} · destaques {len(hl)} · já analisados {len(hl) - len([i for i in hl if i['id'] not in analyses])}"
          f" · a analisar agora {len(todo)} · feitas hoje {done_today}/{MAX_PER_DAY} · edição {'sim' if need_edition else 'não'}")

    if args.dry_run:
        print(f"prompt do sistema: ~{len(system) // 4} tokens (estimativa)")
        for it in todo:
            print("  ·", it["title"][:100])
        return
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("ANTHROPIC_API_KEY não definida: análises com IA desligadas.")
        return

    import anthropic
    client = anthropic.Anthropic(max_retries=3)
    usage_tot = {"in": 0, "out": 0, "cache_read": 0, "cache_write": 0, "calls": 0}

    def add_usage(u):
        usage_tot["calls"] += 1
        usage_tot["in"] += u.input_tokens or 0
        usage_tot["out"] += u.output_tokens or 0
        usage_tot["cache_read"] += getattr(u, "cache_read_input_tokens", 0) or 0
        usage_tot["cache_write"] += getattr(u, "cache_creation_input_tokens", 0) or 0

    others = "\n".join(f"- {x['id']}: {x['title']}" for x in hl)
    for it in todo:
        user = (f"Analise esta notícia.\n\n{item_block(it)}\n\n"
                f"Outros destaques do momento (para o campo conexoes, use só estes ids e nunca o da própria notícia):\n{others}")
        try:
            data, usage, stop = call_claude(client, system, user, analysis_schema(cids))
        except anthropic.RateLimitError:
            print("  limite de uso atingido; paro por aqui e continuo na próxima execução")
            break
        except anthropic.APIStatusError as e:
            print(f"  ✗ erro da API ({e.status_code}) em '{it['title'][:60]}': {e.message}")
            continue
        except anthropic.APIConnectionError:
            print("  ✗ falha de conexão com a API; continuo na próxima execução")
            break
        add_usage(usage)
        if not data:
            print(f"  ✗ sem análise ({stop}): {it['title'][:80]}")
            continue
        valid_ids = {x["id"] for x in hl} - {it["id"]}
        data["conexoes"] = [c for c in data["conexoes"] if c in valid_ids][:4]
        data.update({"created": NOW.isoformat(), "model": MODEL, "title": it["title"]})
        analyses[it["id"]] = data
        print(f"  ✓ {it['title'][:90]}")

    if need_edition and hl:
        top = sorted(items, key=lambda x: -x.get("score", 0))[:25]
        lst = "\n\n".join(f"[{x['id']}]\n{item_block(x)}" for x in top)
        ind = {i["id"]: i for i in latest.get("indicators", [])}
        mk = "; ".join(f"{ind[k]['name']}: {ind[k]['value']:.2f} ({ind[k]['delta']:+.2f}{' p.p.' if ind[k]['delta_kind'] == 'pp' else '%'})"
                       for k in ("selic", "ipca12", "usdbrl", "ibov", "spx", "ust10", "brent", "btc") if k in ind)
        user = (f"Monte a edição do dia {NOW.astimezone(BRT).strftime('%d/%m/%Y')} do NEXUS.\n\n"
                f"Mercados agora: {mk}\n\nNotícias mais relevantes das últimas horas:\n\n{lst}\n\n"
                "Campos: manchete (uma frase que resuma o dia), resumo (4 a 6 itens, cada um com o fato e por que importa, "
                "atribuindo à fonte), acompanhar_hoje (2 a 4 itens concretos), pergunta_estudo (uma pergunta de prova ou de "
                "reflexão ligada a uma matéria que ele cursa agora, citando a matéria), conceito (o id do conceito central do dia) "
                "e itens (os ids das notícias usadas no resumo). Use só o que está no material para os fatos.")
        try:
            data, usage, stop = call_claude(client, system, user, edition_schema(cids), max_tokens=6000)
            add_usage(usage)
            if data:
                data["itens"] = [i for i in data["itens"] if any(x["id"] == i for x in top)]
                data.update({"date": today, "created": NOW.isoformat(), "model": MODEL})
                epath.write_text(json.dumps(data, ensure_ascii=False, indent=1), "utf-8")
                print("  ✓ edição do dia:", data["manchete"][:100])
            else:
                print(f"  ✗ edição não gerada ({stop})")
        except anthropic.APIError as e:
            print(f"  ✗ edição não gerada: {type(e).__name__}")

    # ---------------- Novidades (inovação) e tendências explicadas: uma vez por dia ----------------
    ipath = DATA / "innovation.json"
    innov = json.loads(ipath.read_text("utf-8")) if ipath.exists() else {}
    need_innov = args.force_edition or (innov.get("date") != today and NOW.astimezone(BRT).hour >= EDITION_HOUR_BRT)
    if need_innov:
        cands = [x for x in latest.get("innov", [])
                 if datetime.fromisoformat(x["published"].replace("Z", "+00:00")) > NOW - timedelta(days=10)][:45]
        cands += [{"id": "p:" + p["id"], "title": p["title"], "summary": p["summary"], "source": p["cat"], "link": p["link"],
                   "tipo": "pesquisa", "published": p.get("published", "")} for p in latest.get("papers", [])[:15]]
        seen = {v["ref"] for day in innov.get("history", {}).values() for v in day}
        cands = [c for c in cands if c["id"] not in seen]
        if cands:
            lst = "\n\n".join(f"[{c['id']}] ({c['source']}, {c['tipo']})\n{c['title']}\n{c['summary'][:450]}" for c in cands)
            user = ("Escolha as 5 novidades mais valiosas desta lista para ele: métodos ou cálculos novos, descobertas empíricas, "
                    "técnicas de gestão inovadoras, dados novos ou mudanças de política que valha a pena entender. Prefira o que é "
                    "realmente novo e aplicável (inclusive na empresa de ônibus ou no TCC) ao que é só opinião. Escreva em português "
                    "mesmo quando a fonte for em inglês.\n\n"
                    "Para cada uma: ref (o id entre colchetes), titulo (curto, em português), tipo, o_que_e_novo (2 a 3 frases), "
                    "como_funciona (o mecanismo, o método ou o modelo, 3 a 4 frases), calculo (uma fórmula ou conta ilustrativa em "
                    "texto simples, ou vazio se não couber), por_que_importa (2 frases), como_aplicar (1 a 2 frases práticas) e "
                    "conceito (id da lista de conceitos ou vazio). Baseie-se só no resumo fornecido: se ele não detalhar o método, "
                    "diga o que dá para inferir e que é preciso ler o original.\n\n" + lst)
            schema = {"type": "object", "properties": {"itens": {"type": "array", "items": {
                "type": "object", "properties": {
                    "ref": {"type": "string", "enum": [c["id"] for c in cands]},
                    "titulo": {"type": "string"},
                    "tipo": {"type": "string", "enum": ["método", "descoberta", "técnica de gestão", "dado novo", "política"]},
                    "o_que_e_novo": {"type": "string"}, "como_funciona": {"type": "string"}, "calculo": {"type": "string"},
                    "por_que_importa": {"type": "string"}, "como_aplicar": {"type": "string"},
                    "conceito": {"type": "string", "enum": cids + [""]}},
                "required": ["ref", "titulo", "tipo", "o_que_e_novo", "como_funciona", "calculo", "por_que_importa", "como_aplicar", "conceito"],
                "additionalProperties": False}}}, "required": ["itens"], "additionalProperties": False}
            try:
                data, usage, stop = call_claude(client, system, user, schema, max_tokens=8000)
                add_usage(usage)
                if data:
                    byid = {c["id"]: c for c in cands}
                    picks = []
                    for it in data["itens"][:6]:
                        src = byid.get(it["ref"])
                        if src:
                            it.update({"fonte": src["source"], "link": src["link"], "titulo_original": src["title"], "publicado": src["published"]})
                            picks.append(it)
                    hist = innov.get("history", {})
                    hist[today] = picks
                    innov["history"] = {k: hist[k] for k in sorted(hist)[-14:]}
                    innov.update({"date": today, "created": NOW.isoformat(), "model": MODEL})
                    print(f"  ✓ novidades: {len(picks)} escolhidas")
                else:
                    print(f"  ✗ novidades não geradas ({stop})")
            except anthropic.APIError as e:
                print(f"  ✗ novidades: {type(e).__name__}")
        trends = rising_themes()
        if trends:
            lst = "\n\n".join(f"Tema: {t['tema']} ({t['ultimos7']} manchetes nos últimos 7 dias, {t['anteriores7']} nos 7 anteriores)\n"
                              + "\n".join(f"- {h}" for h in t["manchetes"]) for t in trends)
            user = ("Estes temas cresceram nas manchetes coletadas pelo NEXUS. Para cada um, explique em 2 a 3 frases por que está "
                    "subindo (o que aconteceu, segundo as manchetes) e em 1 frase o que observar a seguir. Use só o que as manchetes "
                    "sustentam; se forem vagas, diga isso.\n\n" + lst)
            schema = {"type": "object", "properties": {"temas": {"type": "array", "items": {"type": "object", "properties": {
                "tema": {"type": "string", "enum": [t["tema"] for t in trends]}, "por_que": {"type": "string"}, "observar": {"type": "string"}},
                "required": ["tema", "por_que", "observar"], "additionalProperties": False}}}, "required": ["temas"], "additionalProperties": False}
            try:
                data, usage, stop = call_claude(client, system, user, schema, max_tokens=4000)
                add_usage(usage)
                if data:
                    meta = {t["tema"]: t for t in trends}
                    innov["tendencias"] = [{**x, "ultimos7": meta[x["tema"]]["ultimos7"], "anteriores7": meta[x["tema"]]["anteriores7"]}
                                           for x in data["temas"] if x["tema"] in meta]
                    innov["tendencias_date"] = today
                    print(f"  ✓ tendências explicadas: {len(innov['tendencias'])}")
            except anthropic.APIError as e:
                print(f"  ✗ tendências: {type(e).__name__}")
        ipath.write_text(json.dumps(innov, ensure_ascii=False, indent=1), "utf-8")

    apath.write_text(json.dumps(analyses, ensure_ascii=False, separators=(",", ":")), "utf-8")
    cost = estimate_cost(usage_tot)
    print(f"tokens: entrada {usage_tot['in']} · saída {usage_tot['out']} · cache lido {usage_tot['cache_read']} · "
          f"cache gravado {usage_tot['cache_write']} · custo estimado US$ {cost:.4f}")
    record_usage(usage_tot, cost, usage_tot["calls"])


def rising_themes(max_themes: int = 4) -> list[dict]:
    """Temas de web/content.js (THEMES) que mais cresceram: últimos 7 dias contra os 7 anteriores, no histórico."""
    js = CONTENT_JS.read_text("utf-8")
    block = js[js.index("const THEMES"):]
    themes = [(n, re.compile(rx, re.I)) for n, rx in re.findall(r"\['([^']+)',/(.+?)/i\]", block)]
    items = []
    for p in sorted((DATA / "archive").glob("20*.json"))[-2:]:
        items += json.loads(p.read_text("utf-8"))
    cut1, cut2 = NOW - timedelta(days=7), NOW - timedelta(days=14)
    out = []
    for name, rx in themes:
        recent, before = [], 0
        for it in items:
            d = datetime.fromisoformat(it["published"].replace("Z", "+00:00"))
            if rx.search(it["title"]):
                if d > cut1:
                    recent.append(it)
                elif d > cut2:
                    before += 1
        if len(recent) >= 5:
            growth = (len(recent) - before) / max(before, 3)
            out.append({"tema": name, "ultimos7": len(recent), "anteriores7": before, "growth": growth,
                        "manchetes": [x["title"] for x in sorted(recent, key=lambda x: x["published"], reverse=True)[:10]]})
    out.sort(key=lambda t: (-t["growth"], -t["ultimos7"]))
    return out[:max_themes]


# Preços por milhão de tokens (US$): entrada, saída, leitura de cache. Gravação de cache = 1,25 × entrada.
PRICES = {"claude-opus-5-5": (4.0, 20.0, 0.20), "claude-sonnet-5-5": (2.0, 10.0, 0.20), "claude-haiku-5-5": (0.10, 0.50, 0.01)}


def estimate_cost(u: dict) -> float:
    pin, pout, pread = PRICES.get(MODEL, PRICES["claude-opus-5-5"])
    return (u["in"] * pin + u["out"] * pout + u["cache_read"] * pread + u["cache_write"] * pin * 1.25) / 1e6


def record_usage(u: dict, cost: float, calls: int) -> None:
    """Acumula o consumo por dia em web/data/usage.json (o app mostra o total do mês)."""
    if not calls:
        return
    path = DATA / "usage.json"
    hist = json.loads(path.read_text("utf-8")) if path.exists() else {}
    day = NOW.astimezone(BRT).strftime("%Y-%m-%d")
    d = hist.setdefault(day, {"calls": 0, "in": 0, "out": 0, "cache_read": 0, "cache_write": 0, "usd": 0.0, "models": []})
    for k in ("in", "out", "cache_read", "cache_write"):
        d[k] += u[k]
    d["calls"] += calls
    d["usd"] = round(d["usd"] + cost, 4)
    if MODEL not in d["models"]:
        d["models"].append(MODEL)
    keep = sorted(hist)[-120:]  # ~4 meses
    path.write_text(json.dumps({k: hist[k] for k in keep}, ensure_ascii=False, indent=1), "utf-8")


if __name__ == "__main__":
    main()
