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
const MAX_SOURCES = 12;
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
  if (L.indicators?.length) parts.push("Indicadores:\n" + L.indicators.map(fmtInd).join("\n"));
  if (L.focus?.rows) parts.push(`Boletim Focus (${L.focus.date}), medianas para ${L.focus.years.join(" e ")}:\n` +
    L.focus.rows.map((r) => `${r.name}: ${r.now.join(" / ")} (há 4 semanas: ${r.prev.join(" / ")})`).join("\n"));
  if (data.edition?.manchete) parts.push(`Edição do dia ${data.edition.date}: ${data.edition.manchete}\n- ${data.edition.resumo.join("\n- ")}`);
  parts.push("Notícias do acervo (cite pelo número entre colchetes):\n" + sources.map((it, k) => {
    const a = data.analyses[it.id];
    let s = `[${k + 1}] ${it.title}\nFonte: ${it.source} (${it.kind === "prim" ? "fonte primária" : "imprensa"}), ${it.published}\nResumo: ${it.summary || "—"}`;
    if (a) s += `\nAnálise do NEXUS: fato: ${a.fato} | mecanismo: ${a.mecanismo} | para o aluno: ${a.para_voce}`;
    return s;
  }).join("\n\n"));
  return parts.join("\n\n");
}

const SYSTEM = `Você é o "Pergunte ao NEXUS", assistente de estudos e de leitura de conjuntura de um estudante de Ciências Econômicas da UFMA (São Luís, Maranhão), na reta final do curso. Ele também é controller e economista-chefe de uma empresa de ônibus no Maranhão, então perguntas sobre custos (diesel, pneus, pessoal), tarifa técnica, reajuste contratual, gratuidades, demanda, financiamento de frota e regulação do transporte são do trabalho dele: responda com o rigor de quem precisa decidir e mostre as contas.

Como responder:
- Português do Brasil, direto e didático. Até uns 250 palavras, salvo se ele pedir mais detalhe.
- Use as notícias e os dados do NEXUS que vêm junto com a pergunta. Quando usar uma notícia, cite o número dela entre colchetes, como [2]. Não cite números que não estejam na lista.
- Separe o que é fato (dito pela fonte ou pelos dados) do que é interpretação sua. Não invente números, datas ou declarações.
- Se o acervo não cobrir o assunto, diga isso e responda com conhecimento geral consolidado, deixando claro que não vem das notícias do NEXUS.
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

export default {
  async fetch(req, env, ctx) {
    const cors = corsHeaders(req, env);
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (url.pathname === "/health") return json({ ok: true, model: env.MODEL }, 200, cors);
    if (url.pathname !== "/chat" || req.method !== "POST") return json({ error: "Rota não encontrada." }, 404, cors);

    if (!env.NEXUS_PASSWORD || !safeEqual(req.headers.get("x-nexus-key"), env.NEXUS_PASSWORD))
      return json({ error: "Senha incorreta." }, 401, cors);
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
    msgs.push({ role: "user", content: [
      { type: "text", text: `<acervo>\n${context}\n</acervo>` },
      { type: "text", text: last.content },
    ] });

    const model = env.MODEL || "claude-opus-5-5";
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 2 });
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const enc = new TextEncoder();
    const send = (event, payload) => writer.write(enc.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`));

    ctx.waitUntil((async () => {
      try {
        await send("meta", { model, sources: sources.map((it, k) => ({ n: k + 1, id: it.id, title: it.title, source: it.source, link: it.link })) });
        const stream = client.beta.messages.stream({
          model,
          max_tokens: 4000,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",            // se o modelo recusar, o servidor da Anthropic tenta o modelo indicado
          output_config: { effort: env.EFFORT || "low" },
          system: [
            { type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } },
            { type: "text", text: `Perfil do aluno:\n${profile || "(não informado)"}` },
          ],
          messages: msgs,
        });
        for await (const ev of stream) {
          if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") await send("text", ev.delta.text);
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") await send("text", "\n\nNão consegui responder a essa pergunta.");
        if (final.stop_reason === "max_tokens") await send("text", "\n\n(Resposta cortada por tamanho. Peça para eu continuar.)");
        const u = final.usage || {};
        const [pi, po, pr] = PRICES[model] || PRICES["claude-opus-5-5"];
        const usd = ((u.input_tokens || 0) * pi + (u.output_tokens || 0) * po + (u.cache_read_input_tokens || 0) * pr +
          (u.cache_creation_input_tokens || 0) * pi * 1.25) / 1e6;
        await send("done", { model: final.model, usage: { in: u.input_tokens, out: u.output_tokens, cache_read: u.cache_read_input_tokens, cache_write: u.cache_creation_input_tokens }, usd });
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
