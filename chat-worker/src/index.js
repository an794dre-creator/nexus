/* NEXUS · servidor do chat "Pergunte ao NEXUS" (Cloudflare Worker).
 *
 * Guarda a chave da API (segredo ANTHROPIC_API_KEY) e só responde a quem envia a senha
 * (segredo NEXUS_PASSWORD) no cabeçalho x-nexus-key. Para cada pergunta, busca no acervo
 * publicado do NEXUS (notícias, análises, indicadores, edição do dia) os itens mais ligados
 * ao assunto e pede ao Claude uma resposta citando essas fontes como [1], [2]...
 *
 * Resposta em Server-Sent Events:  meta (fontes) → text (pedaços) → done (consumo) | error
 */
import Anthropic from "@anthropic-ai/sdk";

const PRICES = { // US$ por milhão de tokens: entrada, saída, leitura de cache
  "claude-opus-5-5": [4, 20, 0.2], "claude-sonnet-5-5": [2, 10, 0.2], "claude-haiku-5-5": [0.1, 0.5, 0.01],
};
const MAX_QUESTION = 2000;     // caracteres por mensagem
const MAX_HISTORY = 10;        // mensagens anteriores enviadas ao modelo
const MAX_SOURCES = 10;
const MODELS = ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5"];   // o app escolhe um destes por pergunta
const DATA_TTL_MS = 5 * 60 * 1000;

let dataCache = { t: 0, data: null };

const STOP = new Set(("a o e é de da do das dos que em no na nos nas um uma uns umas para por com sem sobre como qual quais quando onde porque por que " +
  "isso isto esse essa este esta ao aos à às se mais menos muito muita foi ser são está estão vai pode podem the and of to in for on is are what why how " +
  "me minha meu você voce explique explica fale diga hoje agora notícia notícias noticia noticias").split(" "));

const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const terms = (s) => [...new Set(norm(s).split(/[^a-z0-9%$]+/).filter((w) => w.length > 2 && !STOP.has(w)))];

async function loadData(env) {
  if (dataCache.data && Date.now() - dataCache.t < DATA_TTL_MS) return dataCache.data;
  const get = async (f) => {
    try { const r = await fetch(env.DATA_URL + f, { cf: { cacheTtl: 300 } }); return r.ok ? await r.json() : null; }
    catch { return null; }
  };
  const [latest, analyses, edition] = await Promise.all([get("latest.json"), get("analyses.json"), get("edition.json")]);
  dataCache = { t: Date.now(), data: { latest: latest || {}, analyses: analyses || {}, edition } };
  return dataCache.data;
}

/* Escolhe as notícias mais ligadas à conversa (palavras em comum), com bônus para as que têm análise. */
function pickSources(data, query) {
  const q = terms(query);
  const items = data.latest.items || [];
  const scored = items.map((it) => {
    const text = norm(`${it.title} ${it.summary || ""} ${it.source} ${it.area}`);
    const hits = q.reduce((a, w) => a + (text.includes(w) ? (norm(it.title).includes(w) ? 2 : 1) : 0), 0);
    return { it, s: hits ? hits + (data.analyses[it.id] ? 1.5 : 0) + (it.score || 0) / 10 : 0 };
  }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
  let chosen = scored.slice(0, MAX_SOURCES).map((x) => x.it);
  if (chosen.length < 4) { // pergunta genérica: completa com os destaques do momento
    const top = [...items].sort((a, b) => (b.score || 0) - (a.score || 0)).filter((it) => !chosen.includes(it));
    chosen = chosen.concat(top.slice(0, 8 - chosen.length));
  }
  return chosen;
}

function fmtInd(i) {
  const d = i.delta ? `${i.delta > 0 ? "+" : ""}${i.delta}${i.delta_kind === "pp" ? " p.p." : "%"}` : "estável";
  return `${i.name}: ${i.value} (${d}; ${i.src}${i.as_of ? ", " + i.as_of : ""})`;
}

function buildContext(data, sources) {
  const L = data.latest;
  const parts = [`Dados do NEXUS, coletados em ${L.updated_at || "?"} (UTC).`];
  const KEY = new Set(["selic", "ipca12", "usdbrl", "ibov", "spx", "ust10", "brent", "btc", "desemprego",
    "ipca_geral_slz", "ipca_diesel_slz", "ipca_diesel_br", "ipca_onibus_urbano_slz", "ipca_onibus_urbano_br"]);
  if (L.indicators?.length) parts.push("Indicadores principais:\n" + L.indicators.filter((i) => KEY.has(i.id)).map(fmtInd).join("\n"));
  if (L.focus?.rows) parts.push(`Boletim Focus (${L.focus.date}), medianas para ${L.focus.years.join(" e ")}:\n` +
    L.focus.rows.map((r) => `${r.name}: ${r.now.join(" / ")} (há 4 semanas: ${r.prev.join(" / ")})`).join("\n"));
  if (data.edition?.manchete) parts.push(`Edição do dia ${data.edition.date}: ${data.edition.manchete}\n- ${data.edition.resumo.join("\n- ")}`);
  parts.push("Notícias do acervo (cite pelo número entre colchetes):\n" + sources.map((it, k) => {
    const a = data.analyses[it.id];
    let s = `[${k + 1}] ${it.title}\nFonte: ${it.source} (${it.kind === "prim" ? "fonte primária" : "imprensa"}), ${it.published}\nResumo: ${it.summary || "—"}`;
    if (a) s += `\nAnálise do NEXUS: ${a.mecanismo.slice(0, 400)}`;
    return s;
  }).join("\n\n"));
  return parts.join("\n\n");
}

const SYSTEM = `Você é o "Pergunte ao NEXUS", assistente de estudos e de leitura de conjuntura de um estudante de Ciências Econômicas da UFMA (São Luís, Maranhão), na reta final do curso. Ele também é controller e economista-chefe de uma empresa de ônibus no Maranhão, então perguntas sobre custos (diesel, pneus, pessoal), tarifa técnica, reajuste contratual, gratuidades, demanda, financiamento de frota e regulação do transporte são do trabalho dele: responda com o rigor de quem precisa decidir e mostre as contas.

Ele usa o NEXUS no lugar de pesquisar no Google ou perguntar a outro assistente: perguntas sobre tendências (da economia, das profissões, da gestão), sobre o que um economista, empresário ou empresa está fazendo hoje, sobre o que um autor defende, ou sobre qualquer fato recente.

Como responder:
- Português do Brasil, direto e didático. Perguntas simples: até uns 250 palavras. Pesquisas (tendências, panoramas, "o que fulano faz hoje"): até uns 600 palavras, organizadas em tópicos curtos, terminando com o que observar a seguir.
- Você tem busca na web (web_search) e leitura de páginas (web_fetch). Use quando a pergunta envolver acontecimentos recentes, pessoas, empresas, tendências, previsões ou qualquer coisa que o acervo do NEXUS não cubra. Prefira fontes primárias e confiáveis (órgãos oficiais, bancos centrais, universidades, centros de pesquisa, relatórios de consultorias, imprensa reconhecida, a página ou o perfil da própria pessoa) e dados recentes. Para "tendências segundo fulano", procure o que a própria pessoa escreveu ou disse.
- Quando usar uma notícia do acervo, cite o número dela entre colchetes, como [2]. As fontes da web são numeradas automaticamente: não invente números para elas.
- Separe o que é fato (dito pela fonte ou pelos dados) do que é interpretação sua. Não invente números, datas ou declarações. Se as fontes divergirem, diga.
- Se não achar informação confiável, diga isso em vez de preencher com suposições.
- Quando ajudar, explique a teoria por trás (e as leituras ortodoxa e heterodoxa quando divergirem) e ligue a uma matéria que ele cursa. O perfil dele vem a seguir.
- Para contas, mostre os passos.`;

function corsHeaders(req, env) {
  const origin = req.headers.get("origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim());
  return {
    "access-control-allow-origin": allowed.includes(origin) ? origin : allowed[0] || "",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type, x-nexus-key",
    "access-control-max-age": "86400",
    vary: "origin",
  };
}

function safeEqual(a, b) {
  const x = new TextEncoder().encode(a || ""), y = new TextEncoder().encode(b || "");
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

const json = (obj, status, cors) => new Response(JSON.stringify(obj), { status, headers: { ...cors, "content-type": "application/json; charset=utf-8" } });

/* ---------- mercado: busca de ativos e histórico (Yahoo Finance e Banco Central), com cache de 5 min ---------- */
const UA = { "user-agent": "Mozilla/5.0 (compatible; NEXUS/1.0)", accept: "application/json" };
const RANGES = { "1mo": "1d", "6mo": "1d", "1y": "1d", "5y": "1wk", max: "1mo" };

async function cached(req, ctx, build) {
  const cache = caches.default;
  const key = new Request(new URL(req.url).toString(), { method: "GET" });
  const hit = await cache.match(key);
  if (hit) return hit;
  const res = await build();
  if (res.status === 200) ctx.waitUntil(cache.put(key, res.clone()));
  return res;
}

async function marketSearch(q) {
  const u = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0&lang=pt-BR&region=BR`;
  const r = await fetch(u, { headers: UA });
  if (!r.ok) throw new Error("busca indisponível");
  const d = await r.json();
  return (d.quotes || []).filter((x) => x.symbol && ["EQUITY", "ETF", "INDEX", "CURRENCY", "CRYPTOCURRENCY", "FUTURE", "MUTUALFUND"].includes(x.quoteType))
    .map((x) => ({ symbol: x.symbol, name: x.longname || x.shortname || x.symbol, type: x.typeDisp || x.quoteType, exchange: x.exchDisp || x.exchange }));
}

async function marketQuote(symbol, range) {
  const interval = RANGES[range] || "1d";
  const u = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
  const r = await fetch(u, { headers: UA });
  if (!r.ok) throw new Error("ativo não encontrado");
  const res = (await r.json()).chart?.result?.[0];
  if (!res) throw new Error("sem dados");
  const closes = res.indicators?.quote?.[0]?.close || [];
  const points = (res.timestamp || []).map((t, i) => [t * 1000, closes[i]]).filter((p) => p[1] != null);
  const m = res.meta || {};
  return { symbol: m.symbol || symbol, name: m.longName || m.shortName || symbol, currency: m.currency || "", exchange: m.fullExchangeName || "", points };
}

async function sgsSeries(code, years) {
  const fim = new Date(), ini = new Date(Date.now() - years * 365 * 864e5);
  const f = (d) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  const r = await fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados?formato=json&dataInicial=${f(ini)}&dataFinal=${f(fim)}`, { headers: UA });
  if (!r.ok) throw new Error("série indisponível");
  const rows = await r.json();
  const today = Date.now();
  return rows.map((x) => { const [d, m, y] = x.data.split("/"); return [Date.UTC(+y, +m - 1, +d), +x.valor]; }).filter((p) => p[0] <= today);
}

export default {
  async fetch(req, env, ctx) {
    const cors = corsHeaders(req, env);
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (url.pathname === "/health") return json({ ok: true, model: env.MODEL }, 200, cors);

    if (!env.NEXUS_PASSWORD || !safeEqual(req.headers.get("x-nexus-key"), env.NEXUS_PASSWORD))
      return json({ error: "Senha incorreta." }, 401, cors);

    if (req.method === "GET" && ["/search", "/quote", "/sgs"].includes(url.pathname)) {
      const p = url.searchParams;
      try {
        const res = await cached(req, ctx, async () => {
          let body;
          if (url.pathname === "/search") body = { results: await marketSearch((p.get("q") || "").slice(0, 60)) };
          else if (url.pathname === "/quote") body = await marketQuote((p.get("symbol") || "").slice(0, 30), RANGES[p.get("range")] ? p.get("range") : "1y");
          else body = { points: await sgsSeries(parseInt(p.get("code"), 10), Math.min(Math.max(parseInt(p.get("years"), 10) || 1, 1), 20)) };
          return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300" } });
        });
        const out = new Response(res.body, res);
        Object.entries(cors).forEach(([k, v]) => out.headers.set(k, v));
        return out;
      } catch (err) {
        return json({ error: err.message || "Erro ao buscar dados." }, 502, cors);
      }
    }
    if (url.pathname !== "/chat" || req.method !== "POST") return json({ error: "Rota não encontrada." }, 404, cors);
    if (!env.ANTHROPIC_API_KEY) return json({ error: "O servidor está sem a chave da API." }, 500, cors);

    let body;
    try { body = await req.json(); } catch { return json({ error: "Pedido inválido." }, 400, cors); }
    const msgs = (Array.isArray(body.messages) ? body.messages : [])
      .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
      .slice(-MAX_HISTORY - 1)
      .map((m) => ({ role: m.role, content: m.content.slice(0, m.role === "user" ? MAX_QUESTION : 6000) }));
    while (msgs.length && msgs[0].role !== "user") msgs.shift();
    if (!msgs.length || msgs[msgs.length - 1].role !== "user") return json({ error: "Falta a pergunta." }, 400, cors);

    const data = await loadData(env);
    const recentUser = msgs.filter((m) => m.role === "user").slice(-2).map((m) => m.content).join(" ");
    const sources = pickSources(data, recentUser);
    const context = buildContext(data, sources);
    const profile = typeof body.profile === "string" ? body.profile.slice(0, 4000) : "";

    // a pergunta atual vai junto com o contexto do acervo; as anteriores seguem só como texto
    const last = msgs.pop();
    const hoje = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "numeric", month: "long", year: "numeric" });
    msgs.push({ role: "user", content: [
      { type: "text", text: `Hoje é ${hoje}.\n<acervo>\n${context}\n</acervo>` },
      { type: "text", text: last.content },
    ] });
    const webOn = body.web !== false;   // o app pode desligar a busca na web

    const model = MODELS.includes(body.model) ? body.model : (env.MODEL || "claude-opus-5-5");
    const isHaiku = model.startsWith("claude-haiku");
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 2 });
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const enc = new TextEncoder();
    const send = (event, payload) => writer.write(enc.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`));

    ctx.waitUntil((async () => {
      try {
        await send("meta", { model, sources: sources.map((it, k) => ({ n: k + 1, id: it.id, title: it.title, source: it.source, link: it.link })) });
        // limites enxutos: cada página lida e cada busca entram no texto cobrado
        const tools = !webOn ? [] : isHaiku ? [
          { type: "web_search_20250305", name: "web_search", max_uses: 4 },
          { type: "web_fetch_20250910", name: "web_fetch", max_uses: 2, citations: { enabled: true }, max_content_tokens: 8000 },
        ] : [
          { type: "web_search_20260209", name: "web_search", max_uses: 4 },
          { type: "web_fetch_20260209", name: "web_fetch", max_uses: 2, citations: { enabled: true }, max_content_tokens: 8000 },
        ];
        const webNum = new Map();               // url -> número da fonte (continua depois das do acervo)
        let nextN = sources.length + 1;
        const tot = { in: 0, out: 0, cache_read: 0, cache_write: 0, searches: 0, fetches: 0 };
        let final, turn = 0;
        do {                                    // pesquisas longas podem pausar (pause_turn): o servidor continua de onde parou
          const stream = client.beta.messages.stream({
            model,
            max_tokens: 8000,
            // se o modelo recusar, o servidor da Anthropic tenta o modelo indicado (o Haiku não tem essa opção)
            ...(isHaiku ? {} : { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" }),
            cache_control: { type: "ephemeral" },   // guarda a conversa em cache: nas etapas seguintes da pesquisa ela custa ~5%
            output_config: { effort: env.EFFORT || "low" },
            system: [
              { type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } },
              { type: "text", text: `Perfil do aluno:\n${profile || "(não informado)"}` },
            ],
            ...(tools.length ? { tools } : {}),
            messages: msgs,
          });
          const blocks = {};                    // estado por bloco: tipo, json do input, citações
          for await (const ev of stream) {
            if (ev.type === "content_block_start") {
              const b = ev.content_block;
              blocks[ev.index] = { type: b.type, name: b.name, json: "", cites: [] };
            } else if (ev.type === "content_block_delta") {
              const b = blocks[ev.index] || {};
              if (ev.delta.type === "text_delta") await send("text", ev.delta.text);
              else if (ev.delta.type === "input_json_delta") b.json += ev.delta.partial_json || "";
              else if (ev.delta.type === "citations_delta" && ev.delta.citation?.url) b.cites.push(ev.delta.citation);
            } else if (ev.type === "content_block_stop") {
              const b = blocks[ev.index];
              if (!b) continue;
              if (b.type === "server_tool_use") {
                let input = {}; try { input = JSON.parse(b.json || "{}"); } catch {}
                if (b.name === "web_search") { tot.searches++; await send("status", { kind: "search", text: input.query || "" }); }
                else if (b.name === "web_fetch") { tot.fetches++; await send("status", { kind: "fetch", text: input.url || "" }); }
              } else if (b.type === "text" && b.cites.length) {
                const ns = [];
                for (const c of b.cites) {
                  if (!webNum.has(c.url)) {
                    webNum.set(c.url, nextN);
                    await send("source", { n: nextN, title: c.title || c.url, link: c.url, source: new URL(c.url).hostname.replace(/^www\./, ""), web: true });
                    nextN++;
                  }
                  ns.push(webNum.get(c.url));
                }
                await send("text", ` [${[...new Set(ns)].join(", ")}]`);
              }
            }
          }
          final = await stream.finalMessage();
          const u = final.usage || {};
          tot.in += u.input_tokens || 0; tot.out += u.output_tokens || 0;
          tot.cache_read += u.cache_read_input_tokens || 0; tot.cache_write += u.cache_creation_input_tokens || 0;
          if (final.stop_reason === "pause_turn") msgs.push({ role: "assistant", content: final.content });
        } while (final.stop_reason === "pause_turn" && ++turn < 4);
        if (final.stop_reason === "refusal") await send("text", "\n\nNão consegui responder a essa pergunta.");
        if (final.stop_reason === "max_tokens") await send("text", "\n\n(Resposta cortada por tamanho. Peça para eu continuar.)");
        const [pi, po, pr] = PRICES[model] || PRICES["claude-opus-5-5"];
        const usd = (tot.in * pi + tot.out * po + tot.cache_read * pr + tot.cache_write * pi * 1.25) / 1e6 + tot.searches * 0.01;
        console.log(`chat ${model}: ${tot.searches} buscas, ${tot.fetches} páginas, ${webNum.size} fontes web, ${turn + 1} etapa(s), ` +
          `entrada ${tot.in} + cache lido ${tot.cache_read} + cache gravado ${tot.cache_write}, saída ${tot.out}, US$ ${usd.toFixed(3)}, fim: ${final.stop_reason}`);
        await send("done", { model: final.model, usage: tot, usd });
      } catch (err) {
        let msg = "Erro ao falar com a IA. Tente de novo.";
        if (err instanceof Anthropic.RateLimitError) msg = "Muitas perguntas seguidas. Espere um minuto e tente de novo.";
        else if (err instanceof Anthropic.AuthenticationError) msg = "A chave da API do servidor é inválida.";
        else if (err instanceof Anthropic.APIError && err.status === 400) msg = "A IA recusou o pedido (400). Tente reformular.";
        await send("error", { message: msg });
      } finally {
        await writer.close();
      }
    })());

    return new Response(readable, { headers: { ...cors, "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache" } });
  },
};
