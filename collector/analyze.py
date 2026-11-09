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
- para_voce: 1 a 2 frases ligando a notícia a uma matéria que ele cursa agora (cite o nome da matéria) ou ao Maranhão/Nordeste quando houver relação.
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
    todo = [it for it in hl if it["id"] not in analyses][: max(0, min(MAX_PER_RUN, MAX_PER_DAY - done_today))]
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
    usage_tot = {"in": 0, "out": 0, "cache_read": 0, "cache_write": 0}

    def add_usage(u):
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

    apath.write_text(json.dumps(analyses, ensure_ascii=False, separators=(",", ":")), "utf-8")
    print(f"tokens: entrada {usage_tot['in']} · saída {usage_tot['out']} · cache lido {usage_tot['cache_read']} · cache gravado {usage_tot['cache_write']}")


if __name__ == "__main__":
    main()
