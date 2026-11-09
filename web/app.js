/* NEXUS · app (lê data/latest.json gerado pelo coletor) */
'use strict';

/* ================= navegação ================= */
const IC = {
  hoje:'<path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5"/>',
  radar:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12l6-6"/>',
  mercados:'<path d="M4 19V5"/><path d="M4 19h16"/><path d="M7 15l4-4 3 3 5-6"/>',
  empresas:'<path d="M4 20V8l6-4v16"/><path d="M10 20V10h10v10"/><path d="M3 20h18M13 13h4M13 16h4"/>',
  tendencias:'<path d="M4 18l5-6 4 3 7-9"/><path d="M15 6h5v5"/>',
  academia:'<path d="M3 9l9-5 9 5-9 5z"/><path d="M7 11v5c3 2 7 2 10 0v-5"/>',
  cerebro:'<circle cx="6" cy="7" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="13" r="2.4"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/><path d="M7.6 8.2l2.7 3.2M16.4 7.3l-2.8 4M7.7 16.9l2.6-2.2M16.3 16.9l-2.6-2.2"/>',
  carreira:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2M3 12h18"/>',
  pergunte:'<path d="M5 5h14v10H10l-5 4z"/>',
  mais:'<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>'
};
const LBL = {hoje:'Hoje',radar:'Radar',mercados:'Mercados',empresas:'Empresas e pessoas',tendencias:'Tendências',academia:'Academia',cerebro:'Meu cérebro',carreira:'Carreira',pergunte:'Pergunte'};
const GROUPS = [['Acompanhar',['hoje','radar','mercados','empresas','tendencias']],['Aprender',['academia','cerebro','carreira']],['Perguntar',['pergunte']]];
const MORE = ['empresas','cerebro','carreira','tendencias','pergunte'];
const svg = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg>`;
document.getElementById('nav').innerHTML = GROUPS.map(([g,ks]) => `<div class="navg"><span class="eyebrow">${g}</span>${ks.map(k => `<a href="#${k}" data-nav="${k}">${svg(k)}${LBL[k]}</a>`).join('')}</div>`).join('');
document.getElementById('tabbar').innerHTML = ['hoje','radar','mercados','academia'].map(k => `<a href="#${k}" data-nav="${k}">${svg(k)}${LBL[k]}</a>`).join('') + `<button id="morebtn" aria-expanded="false">${svg('mais')}Mais</button>`;
document.getElementById('more').innerHTML = MORE.map(k => `<a href="#${k}" data-nav="${k}">${svg(k)}${LBL[k]}</a>`).join('');

/* ================= utilidades ================= */
const $ = s => document.querySelector(s);
const ESC = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ESC[c]);
const safeUrl = u => /^https?:\/\//i.test(u || '') ? esc(u) : '#';
function load(k, d){ try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch(e){ return d; } }
function store(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
const nf = (v, d) => Number(v).toLocaleString('pt-BR', {minimumFractionDigits:d, maximumFractionDigits:d});
const sign = v => v > 0 ? '+' : v < 0 ? '−' : '';
function ago(iso){
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ontem' : `há ${d} dias`;
}
const hhmm = iso => new Date(iso).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
const dmy = iso => new Date(iso).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'});
const longDate = d => d.toLocaleDateString('pt-BR', {weekday:'long', day:'numeric', month:'long', year:'numeric'});

/* ================= estado ================= */
let DATA = {items:[], indicators:[], papers:[], focus:null, updated_at:null};
let AN = {};        // análises com IA, por id de notícia (data/analyses.json)
let ED = null;      // edição do dia (data/edition.json)
let ARCH = null;
let loadError = null;
const state = {filter:'todos', q:'', limit:60, mkt:'geral', acad:'mat', ppl:'empresas', reg:'todas', grp:'Todos', k:.8};
const savedMap = load('nexus-saved-items', {});
const MKEY = 'nexus-mastery-v2';  // v2 = grade da UFMA
const mast = load(MKEY, {});
CONC.forEach(c => { if (mast[c.id] != null) c.m = mast[c.id]; });
const ATUAIS = CURSOS.filter(c => c.atual);
const ATUAL_CONC = new Set(ATUAIS.flatMap(c => c.conc));
const SHORT = {psi:'Subst. de importações', tributacao:'Tributação', divida:'Dívida pública', orcamento:'Orçamento público', bens:'Bens públicos',
  estado_desenv:'Estado desenv.', idh:'IDH', capficticio:'Capital fictício', tqtl:'Queda do lucro', capital_humano:'Capital humano',
  plano_real:'Plano Real', cepal:'Centro-periferia', regional:'Desig. regionais', sni:'Sist. de inovação', schumpeter:'Destruição criadora',
  ricardo:'Vant. comparativas', difeq:'Eq. em diferença', regressao:'Regressão', pesquisa:'Projeto de pesquisa', deriv:'Otimização', paridade:'Paridade de juros',
  taylor:'Regra de Taylor', islm:'IS-LM', elast:'Elasticidade', cournot:'Oligopólio', vpl:'VPL e TIR', wacc:'WACC', giro:'Capital de giro', maisvalia:'Mais-valia'};
const short = c => SHORT[c.id] || c.name;
const courseOf = cod => CURSOS.find(c => c.cod === cod);
const coursesFor = id => CURSOS.filter(c => c.conc.includes(id));
const notes = load('nexus-notes', {});

const byItem = id => DATA.items.find(i => i.id === id) || savedMap[id];
const ind = id => DATA.indicators.find(i => i.id === id);
const coById = id => COS.find(c => c.id === id);
const pById = id => PEOPLE.find(p => p.id === id);
const cById = id => CONC.find(c => c.id === id);
const dName = id => (DISC.find(d => d[0] === id) || [])[1];

function prepare(){
  DATA.items = (DATA.items || []).map(it => {
    const text = `${it.title} ${it.summary || ''}`;
    return {...it,
      concepts: CONC.filter(c => c.re.test(text)).map(c => c.id),
      cos: COS.filter(c => c.re.test(text)).map(c => c.id),
      ppl: PEOPLE.filter(p => p.re.test(text)).map(p => p.id)};
  });
}
const mentions = (key, id, list = DATA.items) => list.filter(i => (i[key] || []).includes(id));

/* ================= peças de interface ================= */
const areaChip = a => { const x = AREAS[a] || [a, '']; return `<span class="area ${x[1]}">${esc(x[0])}</span>`; };
const kindTag = k => `<span class="kind ${k === 'prim' ? 'prim' : ''}">${k === 'prim' ? 'Fonte primária' : 'Imprensa'}</span>`;
const bm = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4h12v17l-6-4-6 4z"/></svg>';
const saveBtn = id => `<button class="save${savedMap[id] ? ' on' : ''}" data-save="${esc(id)}" aria-pressed="${!!savedMap[id]}" aria-label="Salvar">${bm}</button>`;
const note = (t, label = 'Aviso') => `<div class="note" role="note"><b>${label}</b><span>${t}</span></div>`;
const head = (eb, h, p) => `<div class="head"><div class="eyebrow">${eb}</div><h1>${h}</h1>${p ? `<p>${p}</p>` : ''}</div>`;
const chips = (name, opts, cur) => `<div class="chips" role="group">${opts.map(([k,l,n]) => `<button class="chip${cur === k ? ' on' : ''}" data-set="${name}" data-val="${esc(k)}" aria-pressed="${cur === k}">${esc(l)}${n != null ? `<span class="n">${n}</span>` : ''}</button>`).join('')}</div>`;
const cbtn = id => { const c = cById(id); return c ? `<button class="cbtn" data-concept="${id}">${esc(c.name)}</button>` : ''; };

function fmtVal(i){
  const v = i.value, p = i.prefix || '', s = i.suffix || '';
  switch (i.fmt) {
    case 'int': return p + nf(v, 0) + s;
    case '1': case '2': case '4': return p + nf(v, +i.fmt) + s;
    case 'pct': return nf(v, 2) + '%';
    case 'pct1': return nf(v, 1) + '%';
    case 'cents_bu': return 'US$ ' + nf(v / 100, 2) + '/bu';
    case 'cents_lb': return 'US$ ' + nf(v / 100, 2) + '/lb';
    case 'tri': return 'US$ ' + nf(v, 2) + ' tri';
  }
  if (i.unit === '%') return nf(v, 2) + '%';
  if (i.unit === 'R$') return 'R$ ' + nf(v, 4);
  return nf(v, 2);
}
function fmtDelta(i){
  if (!i.delta) return 'estável';
  const a = Math.abs(i.delta);
  return i.delta_kind === 'pp' ? `${sign(i.delta)}${nf(a, 2)} p.p.` : `${sign(i.delta)}${nf(a, 2)}%`;
}
function spark(vals, dir){
  if (!vals || vals.length < 2) return '<div class="spark"></div>';
  const w = 200, h = 42, p = 3, mn = Math.min(...vals), mx = Math.max(...vals), rg = (mx - mn) || 1;
  const pts = vals.map((v, i) => [p + i * (w - 2 * p) / (vals.length - 1), h - p - (v - mn) / rg * (h - 2 * p)]);
  const d = pts.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' ');
  const l = pts[pts.length - 1];
  return `<svg class="spark c-${dir}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><path class="ar" d="${d} L${l[0].toFixed(1)} ${h} L${p} ${h} Z"/><path class="ln" d="${d}" vector-effect="non-scaling-stroke"/><circle class="pt" cx="${l[0]}" cy="${l[1]}" r="2.6"/></svg>`;
}
const tile = i => i ? `<div class="tile"><div class="top"><span class="name">${esc(i.name)}</span><span class="d ${i.dir}">${fmtDelta(i)}</span></div><span class="val">${fmtVal(i)}</span>${spark(i.series, i.dir)}<span class="src">${esc(i.src)}${i.as_of ? ' · ' + esc(i.as_of) : ''}${i.note ? '<br>' + esc(i.note) : ''}</span></div>` : '';
function heatCell(n, v){
  const a = Math.min(Math.abs(v) / 3, 1) * 48 + 10, col = v >= 0 ? 'var(--up)' : 'var(--down)';
  return `<div class="cell" style="background:color-mix(in srgb, ${col} ${a.toFixed(0)}%, var(--surface))"><span>${esc(n)}</span><b>${sign(v)}${nf(Math.abs(v), 1)}%</b></div>`;
}
function niceTicks(mn, mx, n = 4){
  const span = mx - mn || Math.abs(mx) || 1, raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw);
  const lo = Math.floor(mn / step) * step, hi = Math.ceil(mx / step) * step, t = [];
  for (let v = lo; v <= hi + step / 2; v += step) t.push(+v.toFixed(6));
  return t;
}
function curveChart(cur, prev, lab){
  const W = 560, H = 230, L = 52, R = 22, T = 18, B = 34;
  const all = cur.concat(prev || []).map(p => p[1]);
  const ticks = niceTicks(Math.min(...all), Math.max(...all)), y0 = ticks[0], y1 = ticks[ticks.length - 1];
  const x = i => L + i * (W - L - R) / (cur.length - 1), y = v => T + (y1 - v) / (y1 - y0) * (H - T - B);
  const path = a => a.map((p, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p[1]).toFixed(1)).join(' ');
  const last = cur[cur.length - 1];
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(lab)}">
   ${ticks.map(t => `<line class="gl" x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/><text class="ax" x="${L - 8}" y="${y(t) + 4}" text-anchor="end">${nf(t, 2)}%</text>`).join('')}
   ${cur.map((p, i) => `<text class="ax" x="${x(i)}" y="${H - 12}" text-anchor="middle">${p[0]}</text>`).join('')}
   ${prev ? `<path class="cv2" d="${path(prev)}"/>` : ''}<path class="cv" d="${path(cur)}"/>
   ${cur.map((p, i) => `<circle class="dot" cx="${x(i)}" cy="${y(p[1])}" r="4"/>`).join('')}
   <text class="lbl" x="${x(cur.length - 1)}" y="${y(last[1]) - 12}" text-anchor="end">${nf(last[1], 2)}%</text></svg>`;
}
function lineChart(vals, dates, lab, fmtTick){
  const W = 560, H = 220, L = 62, R = 16, T = 14, B = 30;
  const ticks = niceTicks(Math.min(...vals), Math.max(...vals)), y0 = ticks[0], y1 = ticks[ticks.length - 1];
  const x = i => L + i * (W - L - R) / (vals.length - 1), y = v => T + (y1 - v) / (y1 - y0) * (H - T - B);
  const d = vals.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ');
  const n = vals.length - 1, marks = [0, Math.round(n / 3), Math.round(2 * n / 3), n];
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(lab)}">
   ${ticks.map(t => `<line class="gl" x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/><text class="ax" x="${L - 8}" y="${y(t) + 4}" text-anchor="end">${fmtTick(t)}</text>`).join('')}
   ${marks.map((i, k) => `<text class="ax" x="${x(i)}" y="${H - 10}" text-anchor="${k === 0 ? 'start' : k === 3 ? 'end' : 'middle'}">${esc((dates[i] || '').slice(0, 5))}</text>`).join('')}
   <path d="${d} L${x(n)} ${H - B} L${L} ${H - B} Z" fill="rgba(247,147,26,.1)"/><path class="cv" d="${d}"/></svg>`;
}
function cobweb(k){
  const W = 560, H = 220, L = 40, R = 16, T = 14, B = 30, y0 = 40, y1 = 160, n = 15, A = 100 * (1 + k);
  const P = [130]; for (let i = 1; i < n; i++) P.push(A - k * P[i - 1]);
  const x = i => L + i * (W - L - R) / (n - 1), y = v => T + (y1 - Math.max(y0 - 20, Math.min(y1 + 20, v))) / (y1 - y0) * (H - T - B);
  const d = P.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Trajetória do preço no modelo da teia de aranha"><defs><clipPath id="cc"><rect x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}"/></clipPath></defs>
   ${[40,70,100,130,160].map(t => `<line class="gl" x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/><text class="ax" x="${L - 8}" y="${y(t) + 4}" text-anchor="end">${t}</text>`).join('')}
   ${[0,2,4,6,8,10,12,14].map(i => `<text class="ax" x="${x(i)}" y="${H - 10}" text-anchor="middle">t${i}</text>`).join('')}
   <line x1="${L}" x2="${W - R}" y1="${y(100)}" y2="${y(100)}" stroke="var(--cool)" stroke-dasharray="4 4"/>
   <g clip-path="url(#cc)"><path class="cv" d="${d}"/>${P.map((v, i) => `<circle class="dot" cx="${x(i)}" cy="${y(v)}" r="3"/>`).join('')}</g></svg>`;
}

/* ================= seleção de destaques ================= */
function highlights(n = 9){
  const out = [], per = {};
  for (const it of [...DATA.items].sort((a, b) => b.score - a.score)) {
    if ((per[it.area] || 0) >= 2) continue;
    per[it.area] = (per[it.area] || 0) + 1;
    out.push(it);
    if (out.length >= n) break;
  }
  return out;
}
const recent = hours => DATA.items.filter(i => Date.now() - new Date(i.published).getTime() < hours * 3600e3);
function storyCard(it, lead){
  return `<article class="card story click${lead ? ' lead' : ''}" data-item="${esc(it.id)}" tabindex="0" role="button">
   <div class="meta">${areaChip(it.area)}<span>${ago(it.published)}</span><span>${esc(it.source)}</span></div>
   <h3>${esc(it.title)}</h3>${it.summary ? `<p>${esc(it.summary)}</p>` : ''}
   <div class="foot"><span class="meta">${AN[it.id] ? '<span class="kind ai">Análise IA</span>' : it.concepts.length ? `${it.concepts.length} conceito${it.concepts.length > 1 ? 's' : ''} ligado${it.concepts.length > 1 ? 's' : ''}` : kindTag(it.kind)}</span><span class="open">${AN[it.id] ? 'Ler análise →' : 'Abrir →'}</span></div></article>`;
}
function itemRow(it){
  return `<div class="row click" data-item="${esc(it.id)}" tabindex="0" role="button"><span class="t">${it.published ? hhmm(it.published) : ''}</span>
   <div><h4>${esc(it.title)}</h4><div class="src">${areaChip(it.area)}<span>${esc(it.source)}</span><span>· ${it.published ? ago(it.published) : ''}</span>${kindTag(it.kind)}</div></div>${saveBtn(it.id)}</div>`;
}
function focusTable(){
  const f = DATA.focus;
  if (!f || !f.rows) return '<p class="muted">Sem dados do Focus nesta coleta.</p>';
  const fmt = (name, v) => v == null ? '—' : name === 'Câmbio' ? nf(v, 2) : nf(v, 2);
  const arrow = (a, b) => a == null || b == null ? '' : a > b ? '<span class="d up">▲</span>' : a < b ? '<span class="d down">▼</span>' : '<span class="d flat">=</span>';
  const label = {IPCA:'IPCA (%)', Selic:'Selic no fim do ano (%)', 'PIB Total':'PIB (%)', 'Câmbio':'Dólar no fim do ano (R$)'};
  return `<div class="scroll"><table class="tb"><thead><tr><th>Indicador</th><th>${f.years[0]}</th><th>${f.years[1]}</th></tr></thead><tbody>
   ${f.rows.map(r => `<tr><td>${esc(label[r.name] || r.name)}</td><td class="mono">${fmt(r.name, r.now[0])} ${arrow(r.now[0], r.prev[0])}</td><td class="mono">${fmt(r.name, r.now[1])} ${arrow(r.now[1], r.prev[1])}</td></tr>`).join('')}
   </tbody></table></div><span class="eyebrow">Boletim Focus · ${f.date ? f.date.split('-').reverse().join('/') : ''} · seta = mudança em 4 semanas</span>`;
}

/* ================= tendências ================= */
function trendData(){
  const src = (ARCH && ARCH.length ? ARCH : DATA.items).filter(i => i.published);
  if (!src.length) return null;
  const now = Date.now(), first = Math.min(...src.map(i => new Date(i.published).getTime()));
  const spanDays = (now - first) / 864e5;
  const daily = spanDays < 21;
  const nb = daily ? 14 : 8, size = (daily ? 1 : 7) * 864e5;
  const bucket = t => nb - 1 - Math.floor((now - t) / size);
  const themes = THEMES.map(([name, re]) => {
    const b = Array(nb).fill(0);
    src.forEach(i => { const k = bucket(new Date(i.published).getTime()); if (k >= 0 && k < nb && re.test(i.title)) b[k]++; });
    const h = Math.floor(nb / 2), a = b.slice(0, h).reduce((x, y) => x + y, 0), z = b.slice(h).reduce((x, y) => x + y, 0);
    const total = a + z;
    const pct = a ? Math.round((z - a) / a * 100) : null;
    return {name, b, total, pct, dir: pct == null ? 'flat' : pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat'};
  }).filter(t => t.total > 0).sort((x, y) => y.total - x.total);
  const cut = now - 30 * 864e5, last30 = src.filter(i => new Date(i.published).getTime() > cut);
  const cos = COS.map(c => [c, last30.filter(i => c.re.test(i.title)).length]).filter(x => x[1]).sort((a, b) => b[1] - a[1]);
  const ppl = PEOPLE.map(p => [p, last30.filter(i => p.re.test(i.title)).length]).filter(x => x[1]).sort((a, b) => b[1] - a[1]);
  const areas = Object.keys(AREAS).map(a => [a, last30.filter(i => i.area === a).length]).sort((a, b) => b[1] - a[1]);
  return {themes, cos, ppl, areas, daily, nb, first, count: src.length, spanDays};
}
function trendRow(t){
  const mx = Math.max(...t.b, 1);
  const pct = t.pct == null ? '<span class="pct d up">novo</span>' : `<span class="pct d ${t.dir}">${sign(t.pct)}${Math.abs(t.pct)}%</span>`;
  return `<div class="trend"><div><h4>${esc(t.name)}</h4><p>${t.total} menções no período</p></div><div class="bars" aria-hidden="true">${t.b.map(v => `<i style="height:${Math.round(v / mx * 100)}%"></i>`).join('')}</div>${pct}</div>`;
}

/* ================= telas ================= */
const V = {};

V.hoje = () => {
  if (!DATA.items.length) return emptyState();
  const hl = highlights(9);
  const tick = ['selic','ipca12','usdbrl','ibov','spx','btc','brent','ust10'].map(ind).filter(Boolean);
  const day = recent(24).length ? recent(24) : DATA.items;
  const ccount = CONC.map(c => [c, mentions('concepts', c.id, day).length]).sort((a, b) => b[1] - a[1]);
  // prefere conceitos das matérias deste semestre e gira entre os mais citados para não repetir sempre o mesmo
  let cand = ccount.filter(x => x[1] >= 2 && ATUAL_CONC.has(x[0].id)).slice(0, 6);
  if (!cand.length) cand = ccount.filter(x => x[1] >= 2).slice(0, 6);
  const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);
  const pick = cand.length ? cand[doy % cand.length] : ccount[0];
  const cday = pick[0];
  const foco = [...COS.map(c => ['company', c, mentions('cos', c.id).length]), ...PEOPLE.map(p => ['person', p, mentions('ppl', p.id).length])].filter(x => x[2]).sort((a, b) => b[2] - a[2]).slice(0, 8);
  const mat = ATUAIS.map(c => [c, day.filter(i => i.concepts.some(k => c.conc.includes(k))).length]);
  const rev = REFORCO.map(cById).filter(c => c && c.m <= 1 && mentions('concepts', c.id, day).length).slice(0, 5);
  const td = trendData();
  return `${head(`${longDate(new Date())} · atualizado ${DATA.updated_at ? ago(DATA.updated_at) : ''}`, 'Panorama <em>do dia</em>', `${hl.length} destaques escolhidos entre ${DATA.items.length} itens das últimas 72 horas, de ${new Set(DATA.items.map(i => i.source)).size} fontes.`)}
  <div class="ticker">${tick.map(t => `<div class="tick"><span>${esc(t.name)}</span><strong>${fmtVal(t)}</strong><span class="d ${t.dir}">${fmtDelta(t)}</span></div>`).join('')}</div>
  ${editionCard()}
  <section class="section"><header><h2>Destaques</h2><a class="link" href="#radar">Ver tudo no radar →</a></header>
   <div class="grid">${hl.map((it, i) => storyCard(it, i === 0)).join('')}</div></section>
  <div class="two">
   <section class="card concept"><div class="eyebrow">Conceito do dia · aparece em ${pick[1]} notícias de hoje</div><h3>${esc(cday.name)}</h3>
    <p>${esc(cday.def)}</p>${cday.f ? `<div class="formula">${esc(cday.f)}</div>` : ''}
    <button class="link" data-concept="${cday.id}">Ver as notícias e praticar →</button></section>
   <section class="card"><h3 class="s">Expectativas do mercado</h3>${focusTable()}</section>
  </div>
  <div class="two">
   <section class="card"><h3 class="s">Em foco: empresas e pessoas nas notícias</h3>
    <div class="mini">${foco.length ? foco.map(([t, x, n]) => t === 'company'
      ? `<button class="pill" data-company="${x.id}"><span class="av">${esc(x.tk.slice(0, 2))}</span>${esc(x.name)}<span class="mono">${n}</span></button>`
      : `<button class="pill" data-person="${x.id}"><span class="av">${esc(x.ini)}</span>${esc(x.name)}<span class="mono">${n}</span></button>`).join('') : '<span class="muted">Nenhuma das empresas e pessoas acompanhadas apareceu hoje.</span>'}</div>
    <a class="link" href="#empresas">Ver empresas e pessoas →</a></section>
   <section class="card"><div class="flexhead"><h3 class="s">Suas matérias nas notícias de hoje</h3><span class="eyebrow">${SEMESTRE_ATUAL}</span></div>
    <div>${mat.map(([c, n]) => `<button class="mrow" data-course="${c.cod}"><span>${esc(c.nome)}</span><span class="mono ${n ? 'hotn' : 'muted'}">${n}</span></button>`).join('')}</div>
    ${rev.length ? `<span class="eyebrow">Para reforçar, e está nas notícias</span><div class="mini">${rev.map(c => cbtn(c.id)).join('')}</div>` : ''}
    <a class="link" href="#cerebro">Abrir meu cérebro →</a></section>
  </div>
  <section class="section"><header><h2>Mais falados</h2><a class="link" href="#tendencias">Ver tendências →</a></header>
   <div class="feed">${td ? td.themes.slice(0, 4).map(trendRow).join('') : '<div class="empty">Carregando histórico…</div>'}</div></section>`;
};

function editionCard(){
  if (!ED || !ED.manchete) return '';
  const todayBR = new Date().toLocaleDateString('sv-SE', {timeZone: 'America/Sao_Paulo'});
  const old = ED.date !== todayBR;
  const refs = (ED.itens || []).map(byItem).filter(Boolean);
  return `<section class="card edition"><div class="flexhead"><span class="eyebrow">Edição do dia${old ? ` · de ${ED.date.split('-').reverse().join('/')}` : ''} · escrita por IA a partir das fontes</span><span class="kind ai">Claude</span></div>
   <h2>${esc(ED.manchete)}</h2>
   <ul class="ed-list">${(ED.resumo || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
   <div class="two" style="gap:18px">
    <div><span class="eyebrow">Acompanhar hoje</span><ul class="ed-list small">${(ED.acompanhar_hoje || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
    <div class="ed-q"><span class="eyebrow">Pergunta para estudar</span><p class="quote">${esc(ED.pergunta_estudo)}</p>${cbtn(ED.conceito)}</div>
   </div>
   ${refs.length ? `<div class="mini">${refs.slice(0, 6).map(i => `<button class="pill" data-item="${esc(i.id)}">${esc(i.source)} · ${esc(i.title.slice(0, 48))}…</button>`).join('')}</div>` : ''}</section>`;
}

V.radar = () => {
  if (!DATA.items.length && state.filter !== 'salvos') return emptyState();
  const f = state.filter, q = state.q.trim().toLowerCase();
  const counts = {}; DATA.items.forEach(i => counts[i.area] = (counts[i.area] || 0) + 1);
  let list = f === 'salvos' ? Object.values(savedMap).sort((a, b) => (b.published || '').localeCompare(a.published || ''))
    : DATA.items.filter(i => f === 'todos' || i.area === f);
  if (q) list = list.filter(i => (`${i.title} ${i.summary || ''} ${i.source}`).toLowerCase().includes(q));
  const shown = list.slice(0, state.limit);
  return `${head(`${DATA.items.length} itens · últimas 72 horas`, 'Radar', 'Tudo o que foi coletado, do mais novo para o mais antigo. Fontes primárias aparecem marcadas.')}
  <div class="search"><input id="q" type="search" placeholder="Buscar por palavra, empresa, fonte…" value="${esc(state.q)}" aria-label="Buscar"></div>
  ${chips('filter', [['todos','Todos',DATA.items.length], ...Object.entries(AREAS).filter(([k]) => counts[k]).map(([k, v]) => [k, v[0], counts[k]]), ['salvos','Salvos',Object.keys(savedMap).length]], f)}
  <div class="feed">${shown.length ? shown.map(itemRow).join('') : `<div class="empty">${f === 'salvos' ? 'Nada salvo ainda. Use o marcador ao lado de uma notícia para guardá-la aqui.' : 'Nenhum item encontrado.'}</div>`}
   ${list.length > shown.length ? `<button class="more-btn" data-more="1">Mostrar mais (${list.length - shown.length})</button>` : ''}</div>`;
};

V.mercados = () => {
  if (!DATA.indicators.length) return emptyState();
  const t = state.mkt, G = g => DATA.indicators.filter(i => i.group === g);
  const tabs = [['geral','Visão geral'],['brasil','Brasil'],['cambio','Câmbio'],['bolsas','Bolsas'],['juros','Juros'],['commod','Commodities e agro'],['cripto','Cripto']];
  let body = '';
  if (t === 'geral') {
    const pct = DATA.indicators.filter(i => i.delta_kind === 'pct' && i.delta);
    const mv = [...pct].sort((a, b) => b.delta - a.delta);
    body = `<section class="card"><div class="flexhead"><h3 class="s">Mapa do dia</h3><span class="eyebrow">variação no último pregão / 24h</span></div><div class="heat">${pct.map(i => heatCell(i.name, i.delta)).join('')}</div></section>
     <div class="two"><section class="card"><h3 class="s">Maiores altas</h3><table class="tb"><tbody>${mv.filter(i => i.delta > 0).slice(0, 5).map(i => `<tr><td>${esc(i.name)}</td><td class="mono d up">${fmtDelta(i)}</td></tr>`).join('') || '<tr><td class="muted">Nenhuma alta</td></tr>'}</tbody></table></section>
     <section class="card"><h3 class="s">Maiores quedas</h3><table class="tb"><tbody>${mv.filter(i => i.delta < 0).reverse().slice(0, 5).map(i => `<tr><td>${esc(i.name)}</td><td class="mono d down">${fmtDelta(i)}</td></tr>`).join('') || '<tr><td class="muted">Nenhuma queda</td></tr>'}</tbody></table></section></div>
     <div class="tiles">${['selic','ipca12','usdbrl','ibov','spx','ust10','brent','btc'].map(ind).map(tile).join('')}</div>`;
  } else if (t === 'brasil') {
    body = `<div class="tiles">${G('brasil').map(tile).join('')}</div><section class="card"><h3 class="s">Expectativas do mercado (Boletim Focus)</h3>${focusTable()}</section>`;
  } else if (t === 'juros') {
    const pts = [['3m','ust13w'],['5a','ust5'],['10a','ust10'],['30a','ust30']].map(([l, id]) => [l, ind(id)]).filter(x => x[1]);
    let chart = '';
    if (pts.length >= 3) {
      const cur = pts.map(([l, i]) => [l, i.value]);
      const prev = pts.map(([l, i]) => [l, i.series[Math.max(0, i.series.length - 22)]]);
      chart = `<section class="card"><div class="flexhead"><h3 class="s">Curva de juros dos EUA</h3><div class="legend"><span><i></i>Hoje</span><span><i class="dash"></i>Há ~1 mês</span></div></div><div class="chart">${curveChart(cur, prev, 'Curva de juros dos EUA')}</div></section>`;
    }
    body = `<div class="tiles">${[ind('selic'), ...G('juros')].map(tile).join('')}</div>${chart}`;
  } else if (t === 'cripto') {
    const b = ind('btc');
    body = `<div class="tiles">${G('cripto').map(tile).join('')}</div>
     ${b && b.series.length > 10 ? `<section class="card"><div class="flexhead"><h3 class="s">Bitcoin · 90 dias</h3><span class="eyebrow">US$</span></div><div class="chart">${lineChart(b.series, b.dates, 'Bitcoin, 90 dias', v => nf(v / 1000, 0) + ' mil')}</div>
     <p class="muted" style="margin:0;font-size:14px">Oferta máxima de 21 milhões de unidades. O próximo halving, que corta pela metade a emissão de novas moedas, está previsto para 2028.</p></section>` : ''}`;
  } else {
    body = `<div class="tiles">${G(t).map(tile).join('')}</div>`;
  }
  return `${head(`Atualizado ${DATA.updated_at ? ago(DATA.updated_at) : ''} · BCB · Yahoo Finance · CoinGecko`, 'Mercados', 'Do juro ao grão, da bolsa ao bitcoin. As cotações de bolsa têm atraso de alguns minutos.')}${chips('mkt', tabs, t)}${body}`;
};

V.empresas = () => {
  const isCo = state.ppl === 'empresas';
  let body;
  if (isCo) {
    const list = COS.filter(c => state.reg === 'todas' || c.reg === state.reg);
    body = `${chips('reg', [['todas','Todas'],['eua','EUA'],['br','Brasil'],['asia','Ásia']], state.reg)}
     <div class="grid">${list.map(c => { const n = mentions('cos', c.id).length; return `<article class="card click" data-company="${c.id}" tabindex="0" role="button">
      <div class="ent"><div class="logo">${esc(c.tk.slice(0, 4))}</div><div><h3>${esc(c.name)}</h3><div class="sub">${esc(c.tk)} · ${esc(c.pais)} · ${esc(c.setor)}</div></div></div>
      <p class="muted" style="margin:0;font-size:14px">${esc(c.tese)}</p><div class="tags">${c.tend.map(x => `<span>${esc(x)}</span>`).join('')}</div>
      <div class="foot"><span class="meta">${n ? `${n} notícia${n > 1 ? 's' : ''} em 72 h` : 'Sem notícias em 72 h'}</span><span class="open">Abrir →</span></div></article>`; }).join('')}</div>`;
  } else {
    const list = PEOPLE.filter(p => state.grp === 'Todos' || p.grp === state.grp);
    body = `${chips('grp', ['Todos','Investidores','Empresários','Economistas','Cripto'].map(g => [g, g]), state.grp)}
     <div class="grid">${list.map(p => { const n = mentions('ppl', p.id).length; return `<article class="card click" data-person="${p.id}" tabindex="0" role="button">
      <div class="ent"><div class="logo round">${esc(p.ini)}</div><div><h3>${esc(p.name)}</h3><div class="sub">${esc(p.grp)}</div></div></div>
      <p class="muted" style="margin:0;font-size:14px">${esc(p.papel)}</p><p class="quote">${esc(p.ideia)}</p>
      <div class="foot"><span class="meta">${n ? `${n} notícia${n > 1 ? 's' : ''} em 72 h` : `Ler: ${esc(p.ler.split(';')[0])}`}</span><span class="open">Abrir →</span></div></article>`; }).join('')}</div>`;
  }
  return `${head('As maiores empresas e as pessoas que movem a economia', 'Empresas <em>e</em> pessoas', 'Perfis fixos ligados às notícias do dia e aos conceitos que você estuda. A contagem de notícias é real e atualiza a cada coleta.')}
   ${chips('ppl', [['empresas','Empresas'],['pessoas','Pessoas']], state.ppl)}${body}`;
};

V.tendencias = () => {
  const td = trendData();
  if (!td) return ARCH === null ? `${head('Histórico', 'Tendências')}<p class="muted">Carregando histórico…</p>` : emptyState();
  const days = Math.max(1, Math.round(td.spanDays));
  const mxA = Math.max(...td.areas.map(a => a[1]), 1), mxC = td.cos.length ? td.cos[0][1] : 1;
  return `${head(`Menções ${td.daily ? 'por dia · últimos 14 dias' : 'por semana · últimas 8 semanas'}`, 'Tendências', 'Temas que aparecem cada vez mais (ou menos) nas manchetes, calculados pelo histórico que o coletor acumula a cada hora.')}
  ${td.spanDays < 14 ? note(`O histórico começou em ${dmy(new Date(td.first).toISOString())} e tem ${td.count} manchetes (${days} dia${days > 1 ? 's' : ''}). As variações ficam confiáveis depois de algumas semanas de coleta.`, 'Histórico curto') : ''}
  <div class="feed">${td.themes.map(trendRow).join('') || '<div class="empty">Nenhum tema acompanhado apareceu ainda.</div>'}</div>
  <div class="two">
   <section class="card"><h3 class="s">Empresas mais citadas (30 dias)</h3>${td.cos.length ? td.cos.slice(0, 8).map(([c, n]) => `<div class="hbar"><span>${esc(c.name)}</span><span class="tr"><i style="width:${Math.round(n / mxC * 100)}%"></i></span><span class="mono">${n}</span></div>`).join('') : '<p class="muted">Nenhuma ainda.</p>'}
    ${td.ppl.length ? `<h3 class="s" style="margin-top:8px">Pessoas citadas</h3><div class="mini">${td.ppl.slice(0, 6).map(([p, n]) => `<button class="pill" data-person="${p.id}"><span class="av">${esc(p.ini)}</span>${esc(p.name)}<span class="mono">${n}</span></button>`).join('')}</div>` : ''}</section>
   <section class="card"><h3 class="s">Assuntos no acervo (30 dias)</h3>${td.areas.filter(a => a[1]).map(([a, n]) => `<div class="hbar"><span>${esc(AREAS[a][0])}</span><span class="tr"><i style="width:${Math.round(n / mxA * 100)}%"></i></span><span class="mono">${n}</span></div>`).join('')}</section>
  </div>
  <p class="muted" style="margin:0;font-size:13.5px">A variação compara a segunda metade do período com a primeira.</p>`;
};

V.academia = () => {
  const t = state.acad;
  const tabs = [['mat','Matemática'],['lab','Laboratório'],['teo','Teoria'],['casos','Casos de empresa'],['rev','Revisão'],['papers','Papers novos']];
  let body = '';
  const newsFor = id => mentions('concepts', id).slice(0, 1)[0];
  if (t === 'mat') body = `<div class="grid wide">${PROBS.map(p => `<section class="card ex">
    <div class="meta"><span class="eyebrow">${esc(p.materia || 'Exercício')}</span>${cbtn(p.conc)}</div><h3 style="font-size:24px">${esc(p.title)}</h3><p style="margin:0">${esc(p.enun)}</p>
    <label for="in-${p.id}">Sua resposta (${esc(p.unit)})</label><div class="ans"><input id="in-${p.id}" inputmode="decimal" placeholder="0,00"><button class="btn" data-check="${p.id}">Conferir</button><button class="btn ghost" data-show="${p.id}">Resolução</button></div>
    <div id="fb-${p.id}" aria-live="polite"></div></section>`).join('')}</div>`;
  else if (t === 'lab') body = `<section class="card"><div class="meta"><span class="eyebrow">Laboratório · modelo da teia de aranha</span>${cbtn('difeq')}</div>
    <h3 style="font-size:28px">Quando o preço de uma safra se estabiliza?</h3>
    <p class="muted" style="margin:0">O preço começa 30% acima do equilíbrio (100). Mova k, a razão entre a reação da oferta e a da demanda, e veja a trajetória.</p>
    <div class="formula">P<sub>t</sub> = A − k · P<sub>t−1</sub> &nbsp;·&nbsp; equilíbrio P* = A / (1 + k) = 100</div>
    <label for="kslider">k = <span id="kval" class="mono"></span> · <span id="kmsg"></span></label>
    <input type="range" id="kslider" min="0.4" max="1.3" step="0.05" value="${state.k}">
    <div class="chart" id="cobchart"></div><div class="legend"><span><i></i>Preço</span><span><i class="dash cool"></i>Equilíbrio</span></div></section>`;
  else if (t === 'teo') body = `<div class="grid wide">${THEORY.map(m => { const n = newsFor(m.conc); return `<section class="card">
    <div class="meta">${cbtn(m.conc)}</div><h3 style="font-size:26px">${esc(m.name)}</h3><div class="formula">${m.eq}</div>
    <dl class="kv"><dt>Intuição</dt><dd>${m.int}</dd><dt>Hipóteses</dt><dd>${m.hip}</dd><dt>Limites</dt><dd>${m.lim}</dd></dl>
    ${n ? `<button class="relbtn" data-item="${esc(n.id)}"><small>Nas notícias de agora</small>${esc(n.title)} →</button>` : ''}</section>`; }).join('')}</div>`;
  else if (t === 'casos') body = `<div class="grid wide">${CASES.map(c => `<article class="card click" data-case="${c.id}" tabindex="0" role="button">
    <span class="eyebrow">${esc(c.per)}${c.materia ? ' · ' + esc(c.materia) : ''}</span><h3 style="font-size:26px">${esc(c.name)}</h3><p class="muted" style="margin:0;font-size:14px">${esc(c.res.split('. ')[0])}.</p>
    <div class="tags"><span>${esc(c.fw)}</span></div><div class="foot"><span class="meta">${notes['case-' + c.id] ? 'Você já respondeu' : `${c.conc.length} conceitos ligados`}</span><span class="open">Estudar o caso →</span></div></article>`).join('')}</div>`;
  else if (t === 'rev') body = `<div class="grid">${FLASH.map((f, i) => `<div class="card flash" id="fl${i}"><span class="q">${f[0]}</span><span class="a" hidden>${f[1]}</span><div class="act"><button class="btn ghost" data-flip="${i}">Mostrar resposta</button></div></div>`).join('')}</div>`;
  else {
    const ps = DATA.papers || [];
    body = `<section class="card"><span class="eyebrow">arXiv (finanças quantitativas e economia) · NBER</span>
     ${ps.length ? ps.slice(0, 30).map(p => `<a class="paper" href="${safeUrl(p.link)}" target="_blank" rel="noopener"><span class="mono" style="color:var(--accent)">${esc(p.cat)}${p.published ? ' · ' + dmy(p.published) : ''}</span><b>${esc(p.title)}</b>${p.authors && p.authors.length ? `<span>${esc(p.authors.join(', '))}</span>` : ''}${p.summary ? `<span>${esc(p.summary)}</span>` : ''}</a>`).join('') : '<p class="muted">Nenhum paper nesta coleta.</p>'}</section>`;
  }
  return `${head('Matemática, teoria e casos, ligados às notícias', 'Academia', 'Cada exercício e modelo puxa um conceito do seu cérebro e mostra onde ele aparece nas notícias de agora.')}${chips('acad', tabs, t)}${body}`;
};

function graphSVG(){
  const W = 1000, H = 620, cx = 500, cy = 310, N = DISC.length, pos = {}, hubs = {};
  const nowDisc = new Set(ATUAIS.map(c => c.eixo));
  DISC.forEach((d, i) => {
    const th = -Math.PI / 2 + i * 2 * Math.PI / N;
    hubs[d[0]] = [cx + 175 * Math.cos(th), cy + 118 * Math.sin(th)];
    const cs = CONC.filter(c => c.disc === d[0]);
    cs.forEach((c, j) => {
      const o = (j - (cs.length - 1) / 2) * .26, far = j % 2 === 0;   // alterna raio para os rótulos não se sobreporem
      pos[c.id] = [cx + (far ? 400 : 330) * Math.cos(th + o), cy + (far ? 250 : 205) * Math.sin(th + o)];
    });
  });
  const seen = new Set(); let cross = '';
  CONC.forEach(c => c.links.forEach(l => { const k = [c.id, l].sort().join('-'); if (seen.has(k) || !pos[l]) return; seen.add(k); const a = pos[c.id], b = pos[l]; cross += `<path class="e2" d="M${a[0].toFixed(0)} ${a[1].toFixed(0)} Q${cx} ${cy} ${b[0].toFixed(0)} ${b[1].toFixed(0)}"/>`; }));
  const day = recent(24).length ? recent(24) : DATA.items;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Mapa de conceitos por disciplina">
   ${DISC.map(d => `<line class="e1" x1="${cx}" y1="${cy}" x2="${hubs[d[0]][0].toFixed(0)}" y2="${hubs[d[0]][1].toFixed(0)}"/>`).join('')}
   ${CONC.map(c => `<line class="e1" x1="${hubs[c.disc][0].toFixed(0)}" y1="${hubs[c.disc][1].toFixed(0)}" x2="${pos[c.id][0].toFixed(0)}" y2="${pos[c.id][1].toFixed(0)}"/>`).join('')}
   ${cross}<g class="me"><circle cx="${cx}" cy="${cy}" r="24"/><text x="${cx}" y="${cy + 6}" text-anchor="middle">você</text></g>
   ${DISC.map(d => `<g class="hub${nowDisc.has(d[0]) ? ' now' : ''}" data-disc="${d[0]}" tabindex="0" role="button" aria-label="${esc(d[1])}"><circle cx="${hubs[d[0]][0].toFixed(0)}" cy="${hubs[d[0]][1].toFixed(0)}" r="34"/><text x="${hubs[d[0]][0].toFixed(0)}" y="${(hubs[d[0]][1] + 4).toFixed(0)}" text-anchor="middle">${esc(d[2])}</text></g>`).join('')}
   ${CONC.map(c => { const n = mentions('concepts', c.id, day).length; return `<g class="cn m${c.m}${ATUAL_CONC.has(c.id) ? ' now' : ''}" data-concept="${c.id}" tabindex="0" role="button" aria-label="${esc(c.name)}, ${MLBL[c.m]}"><circle cx="${pos[c.id][0].toFixed(0)}" cy="${pos[c.id][1].toFixed(0)}" r="9"/><text class="${n ? 'hot' : ''}" x="${pos[c.id][0].toFixed(0)}" y="${(pos[c.id][1] + 24).toFixed(0)}" text-anchor="middle">${esc(short(c))}${n ? ` · ${n}` : ''}</text></g>`; }).join('')}
  </svg>`;
}
V.cerebro = () => {
  const prog = DISC.map(d => { const cs = CONC.filter(c => c.disc === d[0]); return [d[1], cs.reduce((a, c) => a + c.m, 0) / (cs.length * 3)]; });
  const tot = CONC.reduce((a, c) => a + c.m, 0) / (CONC.length * 3);
  const day = recent(72).length ? recent(72) : DATA.items;
  return `${head(`Ciências Econômicas · UFMA · ${CURSOS.length} disciplinas · semestre ${SEMESTRE_ATUAL}`, 'Meu <em>cérebro</em>', 'Sua grade organizada em 8 eixos. Cada ponto é um conceito: a cor mostra o quanto você domina, o anel marca o que está nas matérias deste semestre e o número diz quantas notícias de hoje usam aquele conceito. Clique num eixo para ver as disciplinas, ou num conceito para ver notícias, praticar e anotar.')}
  <section class="card"><div class="flexhead"><h3 class="s">Cursando agora · ${SEMESTRE_ATUAL}</h3><span class="eyebrow">notícias em 72 h</span></div>
   <div>${ATUAIS.map(c => { const n = day.filter(i => i.concepts.some(k => c.conc.includes(k))).length; return `<div class="crow"><button class="mrow" data-course="${c.cod}"><span>${esc(c.nome)}</span><span class="mono ${n ? 'hotn' : 'muted'}">${n}</span></button><div class="mini">${c.conc.map(cbtn).join('')}</div></div>`; }).join('')}</div></section>
  <div class="graph">${graphSVG()}</div>
  <div class="mlegend"><span><i style="background:var(--bg)"></i>Não vi</span><span><i style="background:rgba(247,147,26,.3)"></i>Vi em aula</span><span><i style="background:rgba(247,147,26,.65)"></i>Sei explicar</span><span><i style="background:var(--accent)"></i>Sei aplicar</span><span><i style="background:var(--bg);border-color:var(--fg);border-width:2.5px"></i>Matéria deste semestre</span></div>
  <div class="two">
   <section class="card"><div class="flexhead"><h3 class="s">Domínio por eixo</h3><span class="mono" style="color:var(--accent)">${Math.round(tot * 100)}% geral</span></div>
    <div>${prog.map((p, i) => `<button class="prog" data-disc="${DISC[i][0]}"><span>${esc(p[0])}</span><span class="tr"><i style="width:${Math.round(p[1] * 100)}%"></i></span><span class="mono" style="text-align:right;font-size:12.5px">${Math.round(p[1] * 100)}%</span></button>`).join('')}</div></section>
   <section class="card"><h3 class="s">Para reforçar</h3><p class="muted" style="margin:0;font-size:14px">Conceitos de matérias que aparecem mais de uma vez no seu histórico. Marque “sei explicar” quando estiverem firmes.</p>
    <div class="mini">${REFORCO.map(cById).filter(c => c && c.m <= 1).map(c => cbtn(c.id)).join('') || '<span class="muted">Tudo firme.</span>'}</div>
    <h3 class="s" style="margin-top:6px">Ainda não vistos</h3>
    <div class="mini">${CONC.filter(c => c.m === 0).map(c => cbtn(c.id)).join('') || '<span class="muted">Nenhum.</span>'}</div>
    <div class="lock"><b>Em breve:</b> subir ementas e slides para o NEXUS extrair os conceitos de cada aula (precisa da versão com IA).</div></section>
  </div>`;
};

V.carreira = () => {
  const car = DATA.items.filter(i => i.area === 'carreira');
  return `${head('Notícias, trilhas e certificações', 'Carreira', 'O que o mercado está pedindo para quem estuda economia e finanças, e o que da sua formação já cobre isso.')}
  <section class="section"><header><h2>Notícias de carreira e mercado de trabalho</h2><span class="eyebrow">${car.length} em 72 h</span></header>
   <div class="feed">${car.length ? car.slice(0, 15).map(itemRow).join('') : '<div class="empty">Nenhuma notícia de carreira nas últimas 72 horas.</div>'}</div></section>
  <div class="lock"><b>Vagas:</b> ainda não há uma fonte aberta e estável de vagas. Quando você escolher onde procura (LinkedIn, Gupy, sites de bancos), dá para montar alertas aqui.</div>
  <section class="section"><header><h2>Trilhas</h2></header><div class="grid">${TRILHAS.map(t => `<section class="card"><h3 style="font-size:24px">${esc(t[0])}</h3><p class="muted" style="margin:0;font-size:14px">${esc(t[1])}</p><div class="tags">${t[2].map(s => `<span>${esc(s)}</span>`).join('')}</div><span class="eyebrow">Da sua formação</span><div class="mini">${t[3].map(cbtn).join('')}</div></section>`).join('')}</div></section>
  <section class="card"><h3 class="s">Certificações do mercado financeiro</h3><table class="tb"><tbody>${CERT.map(c => `<tr><td><b>${esc(c[0])}</b><br><span class="muted" style="font-size:12.5px">${esc(c[1])}</span></td><td style="text-align:left" class="muted">${esc(c[2])}</td></tr>`).join('')}</tbody></table></section>`;
};

V.pergunte = () => `${head('Responde com base no acervo e cita as fontes', 'Pergunte ao <em>NEXUS</em>')}
  <div class="lock"><b>Chega na versão 2.</b> O chat precisa da API do Claude, que é cobrada à parte do Claude Pro (alguns dólares por mês para uso pessoal). Quando você tiver a chave, a pergunta vai junto com as notícias, os dados e as suas notas mais relevantes, e a resposta cita de onde veio cada informação.</div>
  <section class="card"><h3 class="s">Perguntas que ele vai responder</h3><ul style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px">
   <li>Por que juros altos nos EUA afetam empresas brasileiras?</li><li>O que mudou nas expectativas do Focus nas últimas 4 semanas, e por quê?</li>
   <li>Quais empresas mais apareceram nas notícias este mês e em que contexto?</li><li>Explique a notícia X usando o que eu estudei em Macroeconomia.</li></ul></section>`;

function emptyState(){
  return `${head('Sem dados', 'Ainda não há coleta')}
   ${note(loadError ? `Não consegui ler data/latest.json (${esc(loadError)}). Rode o coletor: <span class="mono">py collector/collect.py</span>` : 'Rode o coletor para gerar os dados: <span class="mono">py collector/collect.py</span>', 'Dados')}`;
}

/* ================= gaveta ================= */
let lastFocus = null;
function openDrawer(bar, body){
  lastFocus = document.activeElement;
  $('#drawer').innerHTML = `<div class="dbar"><span class="meta">${bar}</span><button class="x" id="dclose">Fechar</button></div><div class="dbody">${body}</div>`;
  $('#drawer').hidden = false; $('#scrim').hidden = false; $('#drawer').scrollTop = 0; document.body.style.overflow = 'hidden'; $('#dclose').focus();
}
function closeDrawer(){
  $('#drawer').hidden = true; $('#scrim').hidden = true; document.body.style.overflow = '';
  if (lastFocus && lastFocus.focus && document.contains(lastFocus)) lastFocus.focus();
}
const blk = (t, body, extra = '') => `<div class="block"><div class="bh"><h3>${t}</h3>${extra}</div>${body}</div>`;
const ul = a => `<ul>${a.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
const relList = list => `<div style="display:flex;flex-direction:column;gap:6px">${list.map(i => `<button class="relbtn" data-item="${esc(i.id)}"><small>${esc(i.source)} · ${ago(i.published)}</small>${esc(i.title)}</button>`).join('')}</div>`;

function openItem(id){
  const it = byItem(id); if (!it) return;
  const concepts = it.concepts || [], cos = (it.cos || []).map(coById), ppl = (it.ppl || []).map(pById);
  const words = new Set(it.title.toLowerCase().split(/\W+/).filter(w => w.length > 4));
  const related = DATA.items.filter(x => x.id !== it.id && x.area === it.area && x.title.toLowerCase().split(/\W+/).some(w => words.has(w))).slice(0, 4);
  openDrawer(`${areaChip(it.area)}${kindTag(it.kind)}<span>${it.published ? ago(it.published) : ''}</span>${saveBtn(it.id)}`,
   `<span class="eyebrow">${esc(it.source)}${it.published ? ' · ' + new Date(it.published).toLocaleString('pt-BR', {dateStyle:'short', timeStyle:'short'}) : ''}</span>
    <h2 id="dtitle">${esc(it.title)}</h2>${it.summary ? `<p style="margin:0">${esc(it.summary)}</p>` : ''}
    <div><a class="btn" href="${safeUrl(it.link)}" target="_blank" rel="noopener">Ler na fonte →</a></div>
    ${concepts.length && !AN[it.id] ? blk('Para estudar', `<div class="mini">${concepts.map(cbtn).join('')}</div>`) : ''}
    ${cos.length || ppl.length ? blk('Empresas e pessoas citadas', `<div class="mini">${cos.map(c => `<button class="pill" data-company="${c.id}"><span class="av">${esc(c.tk.slice(0, 2))}</span>${esc(c.name)}</button>`).join('')}${ppl.map(p => `<button class="pill" data-person="${p.id}"><span class="av">${esc(p.ini)}</span>${esc(p.name)}</button>`).join('')}</div>`) : ''}
    ${AN[it.id] ? analysisHTML(AN[it.id], it) : `${related.length ? blk('Sobre o mesmo assunto', relList(related)) : ''}
    <div class="lock"><b>Sem análise de IA.</b> As análises são feitas para os destaques do dia, logo depois de cada coleta.</div>`}`);
}
function analysisHTML(a, it){
  const T = {f: '<span class="tag fato">Fato</span>', i: '<span class="tag interp">Interpretação</span>', h: '<span class="tag hip">Hipótese</span>'};
  const nb = (n, t, tag, body) => `<div class="block"><div class="bh"><span class="n">${n}</span><h3>${t}</h3>${tag}</div>${body}</div>`;
  const ul2 = arr => `<ul>${(arr || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
  const con = (a.conexoes || []).map(byItem).filter(Boolean);
  return `<div class="ai-head"><span class="kind ai">Análise IA</span><span class="muted">Gerada por Claude a partir do título e do resumo da fonte, ${ago(a.created)}. Confira os fatos na fonte.</span></div>
   ${nb(1, 'O que aconteceu', T.f, `<p>${esc(a.fato)}</p>`)}
   ${nb(2, 'Contexto', T.f, `<p>${esc(a.contexto)}</p>`)}
   ${nb(3, 'Como funciona', T.i, `<p>${esc(a.mecanismo)}</p>`)}
   ${nb(4, 'Possíveis consequências', T.h, ul2(a.consequencias))}
   ${con.length ? nb(5, 'Conexões', T.i, relList(con)) : ''}
   ${nb(6, 'O que acompanhar', '', ul2(a.acompanhar))}
   ${nb(7, 'Para estudar', '', `<div class="mini">${(a.estudar || []).map(cbtn).join('')}</div>`)}
   ${a.para_voce ? `<div class="foryou"><span class="eyebrow">Para você</span><p>${esc(a.para_voce)}</p></div>` : ''}
   ${a.limites ? `<p class="muted" style="margin:0;font-size:13.5px"><b>Limites da análise:</b> ${esc(a.limites)}</p>` : ''}`;
}
function openCompany(id){
  const c = coById(id); if (!c) return;
  const news = mentions('cos', id);
  openDrawer(`<span class="area">${esc(c.setor)}</span><span class="mono">${esc(c.tk)} · ${esc(c.pais)}</span>`,
   `<div class="ent"><div class="logo">${esc(c.tk.slice(0, 4))}</div><h2 id="dtitle">${esc(c.name)}</h2></div>
    ${blk('Modelo de negócio', `<p>${esc(c.tese)}</p>`)}${blk('Tendências que acompanhamos', ul(c.tend))}${blk('Indicadores-chave', ul(c.kpis))}
    ${blk(`Nas notícias (72 h) · ${news.length}`, news.length ? relList(news.slice(0, 8)) : '<p class="muted">Nada nas últimas 72 horas.</p>')}
    ${blk('Para analisar esta empresa', `<div class="mini">${c.conc.map(cbtn).join('')}</div>`)}`);
}
function openPerson(id){
  const p = pById(id); if (!p) return;
  const news = mentions('ppl', id);
  openDrawer(`<span class="area">${esc(p.grp)}</span>`,
   `<div class="ent"><div class="logo round">${esc(p.ini)}</div><h2 id="dtitle">${esc(p.name)}</h2></div><p class="muted" style="margin:0">${esc(p.papel)}</p>
    ${blk('Ideia central', `<p class="quote">${esc(p.ideia)}</p>`)}${blk('Para ler', ul(p.ler.split('; ')))}${blk('O que acompanhar', ul(p.mon))}
    ${blk(`Nas notícias (72 h) · ${news.length}`, news.length ? relList(news.slice(0, 8)) : '<p class="muted">Nada nas últimas 72 horas.</p>')}
    ${blk('Conceitos ligados', `<div class="mini">${p.conc.map(cbtn).join('')}</div>`)}`);
}
function openCase(id){
  const c = CASES.find(x => x.id === id); if (!c) return;
  openDrawer(`<span class="area a1">Caso de empresa</span><span class="mono">${esc(c.per)}</span>`,
   `<h2 id="dtitle">${esc(c.name)}</h2>${blk('O que aconteceu', `<p>${esc(c.res)}</p>`)}${blk('Ferramenta de análise', `<p>${esc(c.fw)}</p>`)}
    ${blk('Pergunta para discussão', `<p class="quote">${esc(c.q)}</p>`)}${blk('Conceitos', `<div class="mini">${c.conc.map(cbtn).join('')}</div>`)}
    ${blk('Sua resposta', `<textarea data-note="case-${c.id}" placeholder="Escreva sua análise. Fica salva neste aparelho.">${esc(notes['case-' + c.id] || '')}</textarea>`)}`);
}
function openConcept(id){
  const c = cById(id); if (!c) return;
  const news = mentions('concepts', id);
  const back = CONC.filter(x => x.links.includes(id)).map(x => x.id), linked = [...new Set([...c.links, ...back])];
  const ppl = PEOPLE.filter(p => p.conc.includes(id)), cos = COS.filter(x => x.conc.includes(id));
  const acadLbl = {mat:'Exercício de matemática', lab:'Simulador no laboratório', teo:'Resumo na teoria', casos:'Casos de empresa'}[c.acad];
  const vis = coursesFor(id);
  openDrawer(`<span class="area a1">${esc(dName(c.disc))}</span>${ATUAL_CONC.has(id) ? '<span class="kind prim">Neste semestre</span>' : ''}`,
   `<h2 id="dtitle">${esc(c.name)}</h2><p style="margin:0">${esc(c.def)}</p>${c.f ? `<div class="formula">${esc(c.f)}</div>` : ''}
    ${blk('Seu domínio', `<div class="mast" role="group">${MLBL.map((l, i) => `<button data-mast="${id}" data-lv="${i}" class="${c.m === i ? 'on' : ''}" aria-pressed="${c.m === i}">${l}</button>`).join('')}</div>`)}
    ${vis.length ? blk('Nas suas disciplinas', `<div style="display:flex;flex-direction:column;gap:6px">${vis.map(v => `<button class="relbtn" data-course="${v.cod}"><small>${esc(v.cod)} · ${esc(v.sems.join(', '))}${v.atual ? ' · cursando' : ''}</small>${esc(v.nome)}</button>`).join('')}</div>`) : ''}
    ${blk(`Nas notícias (72 h) · ${news.length}`, news.length ? relList(news.slice(0, 6)) : '<p class="muted">Não apareceu nas últimas 72 horas.</p>')}
    ${blk('Conectado a', `<div class="mini">${linked.length ? linked.map(cbtn).join('') : '<span class="muted">Sem conexões ainda.</span>'}</div>`)}
    ${ppl.length || cos.length ? blk('Quem usa essa ideia', `<div class="mini">${ppl.map(p => `<button class="pill" data-person="${p.id}"><span class="av">${esc(p.ini)}</span>${esc(p.name)}</button>`).join('')}${cos.map(x => `<button class="pill" data-company="${x.id}"><span class="av">${esc(x.tk.slice(0, 2))}</span>${esc(x.name)}</button>`).join('')}</div>`) : ''}
    ${blk('Praticar', `<a class="link" href="#academia" data-acad="${c.acad}">${acadLbl} →</a>`)}
    ${blk('Minhas notas', `<textarea data-note="c-${id}" placeholder="Anote com suas palavras. Fica salvo neste aparelho.">${esc(notes['c-' + id] || '')}</textarea>`)}`);
}

function openCourse(cod){
  const c = courseOf(cod); if (!c) return;
  const news = DATA.items.filter(i => i.concepts.some(k => c.conc.includes(k)));
  const probs = PROBS.filter(p => c.conc.includes(p.conc)), cases = CASES.filter(x => x.materia === c.nome || x.conc.some(k => c.conc.includes(k))).slice(0, 4);
  const teo = THEORY.filter(t => c.conc.includes(t.conc));
  openDrawer(`<span class="area a1">${esc(dName(c.eixo))}</span><span class="mono">${esc(c.cod)}</span>${c.atual ? '<span class="kind prim">Cursando</span>' : ''}`,
   `<h2 id="dtitle">${esc(c.nome)}</h2><p class="muted" style="margin:0">${c.atual ? `Cursando agora, em ${SEMESTRE_ATUAL}` : 'Cursada'}${c.sems.length > 1 || !c.atual ? ` · no histórico: ${esc(c.sems.join(', '))}` : ''}.</p>
    ${blk('Conceitos', `<div class="mini">${c.conc.map(cbtn).join('')}</div>`)}
    ${blk(`Nas notícias (72 h) · ${news.length}`, news.length ? relList(news.slice(0, 8)) : '<p class="muted">Nada nas últimas 72 horas.</p>')}
    ${probs.length || teo.length ? blk('Praticar', `<div class="mini">${probs.map(p => `<a class="pill" href="#academia" data-acad="mat">✎ ${esc(p.title)}</a>`).join('')}${teo.map(t => `<a class="pill" href="#academia" data-acad="teo">∂ ${esc(t.name)}</a>`).join('')}</div>`) : ''}
    ${cases.length ? blk('Casos para discutir', `<div class="mini">${cases.map(x => `<button class="pill" data-case="${x.id}">${esc(x.name)}</button>`).join('')}</div>`) : ''}
    ${blk('Minhas notas da matéria', `<textarea data-note="curso-${c.cod}" placeholder="Resumos, datas de prova, dúvidas para o professor… Fica salvo neste aparelho.">${esc(notes['curso-' + c.cod] || '')}</textarea>`)}`);
}
function openDisc(id){
  const d = DISC.find(x => x[0] === id); if (!d) return;
  const cs = CURSOS.filter(c => c.eixo === id), cc = CONC.filter(c => c.disc === id);
  const pct = Math.round(cc.reduce((a, c) => a + c.m, 0) / (cc.length * 3) * 100);
  openDrawer(`<span class="area a1">Eixo</span><span class="mono">${pct}% de domínio</span>`,
   `<h2 id="dtitle">${esc(d[1])}</h2>
    ${blk('Conceitos', `<div style="display:flex;flex-direction:column;gap:6px">${cc.map(c => `<button class="relbtn" data-concept="${c.id}"><small>${MLBL[c.m]}${ATUAL_CONC.has(c.id) ? ' · neste semestre' : ''}</small>${esc(c.name)}</button>`).join('')}</div>`)}
    ${blk(`Disciplinas · ${cs.length}`, `<div style="display:flex;flex-direction:column;gap:6px">${cs.map(c => `<button class="relbtn" data-course="${c.cod}"><small>${esc(c.cod)} · ${esc(c.sems.join(', '))}${c.atual ? ' · cursando' : ''}</small>${esc(c.nome)}</button>`).join('')}</div>`)}`);
}

/* ================= render, rotas e eventos ================= */
function current(){ const k = (location.hash || '').slice(1); return V[k] ? k : 'hoje'; }
function render(){
  const k = current();
  $('#view').innerHTML = V[k]();
  document.querySelectorAll('[data-nav]').forEach(a => { const on = a.dataset.nav === k; a.classList.toggle('on', on); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
  $('#morebtn').classList.toggle('on', MORE.includes(k));
  if (k === 'academia' && state.acad === 'lab') bindLab();
  if (k === 'radar') { const q = $('#q'); if (q) q.addEventListener('input', e => { state.q = e.target.value; state.limit = 60; const pos = e.target.selectionStart; render(); const n = $('#q'); n.focus(); n.setSelectionRange(pos, pos); }); }
}
function renderStatus(){
  const el = $('#status');
  if (loadError || !DATA.updated_at) { el.innerHTML = `<span class="live off"><i></i>Sem dados</span>`; return; }
  const h = (Date.now() - new Date(DATA.updated_at).getTime()) / 3600e3;
  el.innerHTML = `<span class="live ${h > 3 ? 'stale' : ''}"><i></i>${h > 3 ? 'Coleta atrasada' : 'Coletor ativo'}</span><span>Atualizado ${ago(DATA.updated_at)}</span><span>${DATA.items.length} itens · ${DATA.indicators.length} indicadores</span>${(DATA.log || []).length ? `<span title="${esc(DATA.log.join('\n'))}">${DATA.log.length} fonte(s) com erro</span>` : ''}`;
}
function bindLab(){
  const s = $('#kslider');
  const upd = () => {
    state.k = +s.value; $('#kval').textContent = nf(state.k, 2); $('#cobchart').innerHTML = cobweb(state.k);
    $('#kmsg').textContent = state.k < 1 ? 'converge: o preço se estabiliza' : state.k === 1 ? 'oscila para sempre com a mesma amplitude' : 'diverge: as oscilações crescem';
  };
  s.addEventListener('input', upd); upd();
}
const stepsHTML = p => `<ol class="steps">${p.steps.map(s => `<li>${s}</li>`).join('')}</ol>`;
const OPEN = {item: openItem, company: openCompany, person: openPerson, concept: openConcept, case: openCase, course: openCourse, disc: openDisc};

document.addEventListener('click', e => {
  const t = e.target;
  if (t.closest('#morebtn')) { const m = $('#more'); m.hidden = !m.hidden; $('#morebtn').setAttribute('aria-expanded', !m.hidden); $('#scrim').hidden = m.hidden && $('#drawer').hidden; return; }
  if (t.closest('#more a')) { $('#more').hidden = true; $('#scrim').hidden = $('#drawer').hidden; }
  const sv = t.closest('[data-save]');
  if (sv) {
    e.stopPropagation();
    const id = sv.dataset.save, it = byItem(id);
    if (savedMap[id]) delete savedMap[id];
    else if (it) savedMap[id] = {id: it.id, title: it.title, link: it.link, source: it.source, area: it.area, kind: it.kind, published: it.published, summary: it.summary, concepts: it.concepts, cos: it.cos, ppl: it.ppl};
    store('nexus-saved-items', savedMap);
    document.querySelectorAll(`[data-save="${CSS.escape(id)}"]`).forEach(b => { b.classList.toggle('on', !!savedMap[id]); b.setAttribute('aria-pressed', !!savedMap[id]); });
    if (current() === 'radar' && state.filter === 'salvos') render();
    return;
  }
  const ac = t.closest('[data-acad]');
  if (ac) { state.acad = ac.dataset.acad; if (!$('#drawer').hidden) closeDrawer(); if (current() === 'academia') { e.preventDefault(); render(); window.scrollTo(0, 0); } return; }
  const ms = t.closest('[data-mast]');
  if (ms) {
    const c = cById(ms.dataset.mast); c.m = +ms.dataset.lv; mast[c.id] = c.m; store(MKEY, mast);
    ms.parentElement.querySelectorAll('button').forEach(b => { const on = +b.dataset.lv === c.m; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    if (['cerebro', 'hoje'].includes(current())) render();
    return;
  }
  for (const key of Object.keys(OPEN)) { const el = t.closest(`[data-${key}]`); if (el && !el.matches('textarea')) { OPEN[key](el.dataset[key]); return; } }
  const st = t.closest('[data-set]'); if (st) { state[st.dataset.set] = st.dataset.val; state.limit = 60; render(); return; }
  if (t.closest('[data-more]')) { state.limit += 60; render(); return; }
  const ck = t.closest('[data-check]');
  if (ck) {
    const p = PROBS.find(x => x.id === ck.dataset.check), raw = $('#in-' + p.id).value.trim();
    const v = parseFloat(raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw), fb = $('#fb-' + p.id);
    if (isNaN(v)) { fb.innerHTML = '<div class="fb no">Digite um número, por exemplo 5,60.</div>'; return; }
    const ok = Math.abs(v - p.ans) <= p.tol;
    if (ok) { const c = cById(p.conc); if (c && c.m < 3) { c.m = Math.max(c.m, 2); mast[c.id] = c.m; store(MKEY, mast); } }
    fb.innerHTML = ok ? `<div class="fb ok"><b>Certo.</b> “${esc(cById(p.conc).name)}” subiu no seu cérebro.</div>${stepsHTML(p)}` : '<div class="fb no"><b>Ainda não.</b> Revise o conceito e tente de novo.</div>';
    return;
  }
  const sh = t.closest('[data-show]'); if (sh) { const p = PROBS.find(x => x.id === sh.dataset.show); $('#fb-' + p.id).innerHTML = stepsHTML(p); return; }
  const fp = t.closest('[data-flip]'); if (fp) { const c = $('#fl' + fp.dataset.flip); c.querySelector('.a').hidden = false; c.querySelector('.act').innerHTML = '<button class="btn ghost" data-rate="1">Rever amanhã</button><button class="btn" data-rate="7">Sei bem · 7 dias</button>'; return; }
  const rt = t.closest('[data-rate]'); if (rt) { rt.closest('.act').innerHTML = `<span class="eyebrow">Volta ${rt.dataset.rate === '1' ? 'amanhã' : 'em 7 dias'}</span>`; return; }
  if (t.id === 'scrim') { if (!$('#more').hidden) { $('#more').hidden = true; $('#morebtn').setAttribute('aria-expanded', 'false'); } if (!$('#drawer').hidden) closeDrawer(); $('#scrim').hidden = true; return; }
  if (t.id === 'dclose') closeDrawer();
  if (t.closest('.drawer a[href^="#"]')) closeDrawer();
});
document.addEventListener('input', e => { const n = e.target.dataset && e.target.dataset.note; if (n) { notes[n] = e.target.value; store('nexus-notes', notes); } });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (!$('#drawer').hidden) closeDrawer(); if (!$('#more').hidden) { $('#more').hidden = true; $('#scrim').hidden = true; } }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"]') && !e.target.matches('button')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', {bubbles: true})); }
});
window.addEventListener('hashchange', () => { if (!$('#drawer').hidden) closeDrawer(); render(); window.scrollTo(0, 0); });

/* ================= carga de dados ================= */
async function loadData(){
  try {
    const r = await fetch('data/latest.json', {cache: 'no-cache'});
    if (!r.ok) throw new Error('HTTP ' + r.status);
    DATA = Object.assign({items: [], indicators: [], papers: []}, await r.json());
    loadError = null;
  } catch (err) { loadError = err.message; }
  const [an, ed] = await Promise.all(['data/analyses.json', 'data/edition.json'].map(u =>
    fetch(u, {cache: 'no-cache'}).then(r => r.ok ? r.json() : null).catch(() => null)));
  AN = an || {}; ED = ed;
  prepare(); renderStatus(); render();
  loadArchive();
}
async function loadArchive(){
  try {
    const months = await (await fetch('data/archive/index.json', {cache: 'no-cache'})).json();
    const parts = await Promise.all(months.slice(-3).map(m => fetch(`data/archive/${m}.json`, {cache: 'no-cache'}).then(r => r.ok ? r.json() : [])));
    ARCH = parts.flat();
  } catch (e) { ARCH = []; }
  if (['tendencias', 'hoje'].includes(current())) render();
}
loadData();
setInterval(() => { if (document.visibilityState === 'visible') loadData(); }, 15 * 60e3);
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
