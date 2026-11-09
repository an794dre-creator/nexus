/* Conteúdo fixo do NEXUS: grade do curso (Ciências Econômicas · UFMA), conceitos, exercícios,
   teoria, casos e perfis. Para atualizar a grade a cada semestre, edite CURSOS e SEMESTRE_ATUAL. */

const SEMESTRE_ATUAL = '2026.2';

const AREAS = {
  macro: ['Macro Brasil', 'a1'], global: ['Economia global', 'a1'], regional: ['Nordeste e MA', 'a3'],
  mercados: ['Mercados', ''], empresas: ['Empresas', ''], ia: ['IA e tecnologia', 'a2'], cripto: ['Cripto', 'a1'],
  agro: ['Agro', 'a3'], politica: ['Política', ''], carreira: ['Carreira', 'a2']
};

/* ---------- eixos da grade (os "hubs" do mapa) ---------- */
const DISC = [
  ['setorpub', 'Setor público e finanças públicas', 'Setor público'],
  ['fin', 'Finanças e projetos', 'Finanças'],
  ['ecobr', 'Economia brasileira e regional', 'Brasil e MA'],
  ['desenv', 'Desenvolvimento e inovação', 'Desenvolv.'],
  ['marx', 'Economia política', 'Ec. política'],
  ['macro', 'Macro, moeda e internacional', 'Macro'],
  ['micro', 'Micro e organização industrial', 'Micro'],
  ['quant', 'Métodos quantitativos e pesquisa', 'Quant.']
];

/* ---------- histórico: [código, nome, eixo, semestres, conceitos] ---------- */
const CURSOS = [
  ['DECC0124','Administração Financeira e Orçamentária I','fin',['2026.2'],['wacc','giro','vpl','orcamento']],
  ['DCON0238','Economia Brasileira Contemporânea I','ecobr',['2026.2'],['psi','plano_real','cepal']],
  ['DCON0169','Economia do Setor Público','setorpub',['2026.2'],['bens','tributacao','divida','orcamento']],
  ['DCON0206','Economia Marxista II','marx',['2026.2'],['tqtl','capficticio','maisvalia']],
  ['DCON0251','Estratégias de Desenvolvimento Comparadas','desenv',['2026.2'],['estado_desenv','psi','idh']],
  ['DCON0228','Inovação e Desenvolvimento','desenv',['2026.2'],['sni','schumpeter']],
  ['DCON0249','Projeto de Pesquisa','quant',['2025.2','2026.2'],['pesquisa','regressao']],
  ['DCON0247','Formação Econômica do Maranhão','ecobr',['2026.1'],['regional']],
  ['DCON0212','Economia Regional e Urbana','ecobr',['2026.1'],['regional']],
  ['DCON0245','Elaboração e Análise de Projetos Econômicos','fin',['2026.1'],['vpl']],
  ['DSOC0359','Relações Étnico-Raciais e Cultura Afro-Brasileira e Indígena','desenv',['2026.1'],['idh']],
  ['DCON0209','Teoria Macroeconômica III','macro',['2024.2','2026.1'],['paridade','islm']],
  ['DCON0208','Desenvolvimento Socioeconômico I','desenv',['2025.2','2026.1'],['idh']],
  ['DCON0213','Econometria','quant',['2023.1','2025.4'],['regressao']],
  ['DCON0163','Análise de Conjuntura Econômica','ecobr',['2025.2'],['taylor','plano_real']],
  ['DCON0240','Economia do Nordeste','ecobr',['2025.2'],['regional','cepal']],
  ['DCON0257','Inteligência Artificial, Economia e Sociedade','desenv',['2025.2'],['schumpeter','capital_humano']],
  ['DCON0204','Economia Marxista I','marx',['2023.2','2025.2'],['maisvalia']],
  ['DCON0207','Teoria Macroeconômica II','macro',['2024.1','2025.2'],['islm','taylor']],
  ['DECC0226','Administração Financeira','fin',['2025.1'],['vpl','giro']],
  ['DCON0200','Contabilidade Social','macro',['2025.1'],['islm']],
  ['DCON0248','Economia Agrícola','micro',['2025.1'],['difeq','elast']],
  ['DCON0160','Matemática Econômica II','quant',['2025.1'],['difeq','deriv']],
  ['DCON0195','Teoria Microeconômica I','micro',['2025.1'],['elast','deriv']],
  ['DCON0162','Álgebra Linear','quant',['2024.2'],['regressao']],
  ['DCON0250','Economia do Trabalho','micro',['2024.2'],['capital_humano']],
  ['DCON0174','Estatística Econômica II','quant',['2024.2'],['regressao']],
  ['DCON0211','Formação Econômica do Brasil','ecobr',['2024.2'],['psi','regional','cepal']],
  ['DCON0205','Economia Industrial I','micro',['2024.1'],['cournot','schumpeter']],
  ['DCON0170','Estado e Capital','setorpub',['2024.1'],['estado_desenv','bens']],
  ['DCON0246','Política Econômica','macro',['2024.1'],['taylor','divida']],
  ['DCON0159','Matemática Econômica I','quant',['2022.2','2024.1'],['deriv']],
  ['DCON0203','Desenvolvimento do Capitalismo Contemporâneo','desenv',['2023.2'],['capficticio','estado_desenv']],
  ['DCON0202','Teoria Macroeconômica I','macro',['2023.2'],['islm']],
  ['DCON0196','Teoria Microeconômica II','micro',['2023.2'],['cournot']],
  ['DCON0239','Economia Internacional I','macro',['2023.1'],['paridade','ricardo']],
  ['DCON0210','Economia Monetária','macro',['2023.1'],['taylor','capficticio']],
  ['DCON0164','Estatística Econômica I','quant',['2023.1'],['regressao']],
  ['DCON0201','Formação e Desenvolvimento do Capitalismo','desenv',['2023.1'],['schumpeter','maisvalia']],
  ['DCON0161','Pensamento Econômico Neoclássico','micro',['2023.1'],['elast','deriv']],
  ['DCON0198','Economia Clássica','marx',['2022.2'],['ricardo','maisvalia']],
  ['DCON0158','Evolução das Ideias Econômicas e Sociais','marx',['2022.2'],['ricardo']],
  ['DCON0199','Introdução à Economia','micro',['2022.2'],['elast']],
  ['DCON0194','Técnica de Pesquisa em Economia','quant',['2022.2'],['pesquisa']]
].map(c => ({cod:c[0], nome:c[1], eixo:c[2], sems:c[3], conc:c[4], atual:c[3].includes(SEMESTRE_ATUAL), repetida:c[3].length > 1}));

/* ---------- conceitos: [id, nome, eixo, domínio inicial 0-3, definição, fórmula, aba da academia, conexões, regex nas notícias] ---------- */
const CONC = [
  // Setor público (cursando)
  ['bens','Bens públicos e externalidades','setorpub',1,'Bens não rivais e não excludentes, e efeitos sobre terceiros que o preço não captura. Justificam a provisão pública, impostos corretivos e regulação.','Σ TMgSᵢ = TMgT (condição de Samuelson)','teo',['tributacao','estado_desenv'],/bens? p[uú]blicos?|externalidade|polui[cç]|saneamento|desmatamento|carbono|subs[ií]dio/i],
  ['tributacao','Tributação e incidência','setorpub',1,'Quem de fato arca com um imposto depende das elasticidades, não de quem o recolhe. A reforma tributária troca cinco tributos sobre consumo por um IVA dual (CBS e IBS).','parcela do consumidor = εₛ / (εₛ − ε_d)','mat',['elast','divida'],/imposto|tribut|\biva\b|\bibs\b|\bcbs\b|icms|isen[cç][aã]o|imposto de renda|imposto seletivo|arrecada/i],
  ['divida','Dívida pública e sustentabilidade fiscal','setorpub',1,'A dívida/PIB se estabiliza quando o superávit primário compensa a diferença entre juro real e crescimento. Por isso juros altos e PIB fraco pioram a conta.','Δb = [(r − g)/(1 + g)]·b − s','mat',['taylor','orcamento'],/d[ií]vida p[uú]blica|d[ií]vida bruta|prim[aá]rio|\bfiscal\b|arcabou[cç]o|d[eé]ficit|super[aá]vit|responsabilidade fiscal/i],
  ['orcamento','Orçamento público (PPA, LDO, LOA)','setorpub',1,'O planejamento federal em três leis: o PPA (4 anos), a LDO (metas e prioridades do ano seguinte) e a LOA (receitas e despesas). Contingenciamentos e emendas mudam a execução.','Resultado primário = receitas − despesas (sem juros)','teo',['divida'],/or[cç]ament|\bldo\b|\bloa\b|\bppa\b|emendas|contingenc|bloqueio de gastos|despesas obrigat/i],
  // Finanças (AFO cursando)
  ['vpl','VPL e TIR','fin',2,'Valor presente líquido: fluxos futuros descontados menos o investimento. A TIR é a taxa que zera o VPL. Projeto com VPL positivo cria valor.','VPL = Σ FCₜ/(1+r)ᵗ − I₀','mat',['wacc'],/investimentos? de|aporte|capex|bilh[oõ]es em|investir|projeto de|\btir\b/i],
  ['wacc','Custo de capital (WACC)','fin',1,'A taxa mínima que um investimento precisa render: média ponderada do custo do capital próprio e do custo da dívida depois do imposto.','WACC = E/V·Kₑ + D/V·K_d·(1 − T)','mat',['vpl','taylor'],/custo de capital|wacc|endividamento|alavancagem|deb[eê]ntures|emiss[aã]o de d[ií]vida|capta[cç][aã]o/i],
  ['giro','Capital de giro e ciclo financeiro','fin',2,'Quanto tempo o dinheiro da empresa fica preso entre pagar fornecedores e receber dos clientes. Ciclo longo exige financiamento de curto prazo.','Ciclo financeiro = PMRE + PMRV − PMPF','mat',['wacc'],/capital de giro|liquidez|fluxo de caixa|recupera[cç][aã]o judicial|inadimpl|estoques/i],
  // Economia brasileira e regional
  ['psi','Industrialização por substituição de importações','ecobr',2,'Estratégia de 1930 a 1980: proteção e Estado investidor para produzir internamente o que se importava. Industrializou o país, mas com baixa competitividade e dívida externa.','','teo',['estado_desenv','cepal'],/industrializa[cç]|substitui[cç][aã]o de importa|neoindustrializa|nova ind[uú]stria|ind[uú]stria nacional|conte[uú]do local/i],
  ['plano_real','Plano Real e o tripé macroeconômico','ecobr',1,'A URV desindexou a economia e acabou com a inflação inercial em 1994. Desde 1999 vale o tripé: metas de inflação, câmbio flutuante e metas fiscais.','','casos',['taylor','divida'],/plano real|trip[eé]|meta de infla|metas de infla|c[aâ]mbio flutuante/i],
  ['cepal','Centro-periferia (Prebisch e Furtado)','ecobr',2,'Para a CEPAL, os preços de produtos primários tendem a cair em relação aos industrializados, e a periferia exportadora perde com a deterioração dos termos de troca.','TT = Pₓ / Pₘ','teo',['psi','ricardo'],/exporta[cç]|commodit|min[eé]rio|soja|petr[oó]leo|termos de troca|balan[cç]a comercial|reprimariza/i],
  ['regional','Desigualdades regionais','ecobr',2,'Causação circular cumulativa (Myrdal), o diagnóstico do GTDN e a Sudene (Furtado): regiões atrasadas tendem a ficar para trás sem política ativa. No Maranhão, enclaves exportadores convivem com renda baixa.','','teo',['cepal','idh'],/nordeste|maranh[aã]o|s[aã]o lu[ií]s|imperatriz|sudene|desigualdade regional|matopiba|itaqui/i],
  // Desenvolvimento e inovação (cursando)
  ['sni','Sistemas nacionais de inovação','desenv',1,'A rede de empresas, universidades, governo e financiamento que gera e difunde tecnologia num país (Freeman, Lundvall, Nelson). Explica por que países com recursos parecidos inovam em ritmos diferentes.','','casos',['schumpeter','estado_desenv'],/inova[cç]|pesquisa e desenvolvimento|\bp&d\b|patente|finep|embrapii|embrapa|ci[eê]ncia e tecnologia|universidades?/i],
  ['schumpeter','Destruição criadora (Schumpeter)','desenv',2,'O capitalismo avança quando inovações destroem negócios antigos. O lucro extraordinário do inovador atrai imitadores até desaparecer.','','casos',['sni','cournot'],/disrup|startups?|intelig[eê]ncia artificial|\bia\b|\bai\b|openai|anthropic|nova tecnologia|automa[cç]/i],
  ['estado_desenv','Estado desenvolvimentista','desenv',1,'Coreia do Sul e Taiwan cresceram com política industrial, crédito dirigido e metas de exportação cobradas das empresas (Amsden, Chang, Evans). A pergunta é por que o mesmo instrumento deu resultados diferentes no Brasil.','','casos',['psi','sni'],/pol[ií]tica industrial|bndes|desenvolvimentis|china|coreia|catch.?up|nova ind[uú]stria brasil/i],
  ['idh','Desenvolvimento humano e capacitações','desenv',1,'Para Amartya Sen, desenvolvimento é expansão das liberdades reais das pessoas, não só da renda. O IDH combina renda, educação e saúde.','IDH = ∛(I_renda · I_educação · I_saúde)','teo',['regional','capital_humano'],/\bidh\b|pobreza|desigualdade|bolsa fam[ií]lia|fome|renda per capita|gini|vulnerabilidade/i],
  // Economia política (Marxista II cursando)
  ['maisvalia','Mais-valia e exploração','marx',1,'O valor novo criado pelo trabalho excede o salário pago. A diferença, a mais-valia, é a origem do lucro. Pode crescer por jornada maior (absoluta) ou por produtividade (relativa).','e = m / v','mat',['tqtl','ricardo'],/mais-valia|jornada de trabalho|escala 6x1|precariza|uberiza|produtividade do trabalho/i],
  ['tqtl','Tendência à queda da taxa de lucro','marx',0,'No Livro III, Marx argumenta que a mecanização eleva a composição orgânica do capital (c/v) e pressiona a taxa de lucro para baixo, com contratendências como o aumento da exploração e o barateamento do capital constante.','r = e / (1 + q),  q = c / v','mat',['maisvalia','capficticio'],/taxa de lucro|lucratividade|margens? (?:caem|em queda|comprimid)|rentabilidade em queda/i],
  ['capficticio','Capital fictício e crédito','marx',1,'Títulos que dão direito a rendas futuras (ações, dívida pública, derivativos) circulam com valor próprio, descolado da produção. Crises surgem quando esse valor precisa voltar a se realizar.','Preço do título = renda esperada / taxa de juros','teo',['tqtl','taylor'],/bolha|especula|financeiriza|deriv(?:ativo|ativos)|alavancag|crise financeira|a[cç][oõ]es (?:disparam|despencam)/i],
  ['ricardo','Vantagens comparativas (Ricardo)','marx',2,'Um país ganha com o comércio ao se especializar no que produz com menor custo de oportunidade, mesmo sem vantagem absoluta. A CEPAL contestou a conclusão para a periferia.','','teo',['cepal','paridade'],/com[eé]rcio internacional|livre com[eé]rcio|acordo comercial|tarif|mercosul|uni[aã]o europeia/i],
  // Macro
  ['islm','Modelo IS-LM','macro',1,'Equilíbrio simultâneo do mercado de bens (IS) e do mercado monetário (LM). Política fiscal desloca a IS; política monetária desloca a LM (ou a regra de juros, no IS-MP).','IS: Y = C(Y − T) + I(r) + G   ·   LM: M/P = L(Y, r)','teo',['taylor','divida'],/\bpib\b|demanda agregada|gasto p[uú]blico|est[ií]mulo|consumo das fam[ií]lias|investimento/i],
  ['taylor','Regra de Taylor e metas de inflação','macro',1,'Descreve como o banco central reage: sobe o juro mais que a inflação quando ela passa da meta, e mais ainda se a economia está aquecida.','i = r* + π + 0,5(π − π*) + 0,5(y − y*)','teo',['islm','paridade'],/copom|\bselic\b|\bfed\b|federal reserve|taxa de juros|interest rates?|rate cut|banco central/i],
  ['paridade','Paridade de juros e câmbio','macro',1,'A diferença de juros entre dois países deveria ser compensada pela variação esperada do câmbio. Quando não é, surge o carry trade.','E[Sₜ₊₁]/Sₜ = (1 + i)/(1 + i*)','mat',['taylor','ricardo'],/d[oó]lar|c[aâ]mbio|treasur|moeda|real se (?:valoriza|desvaloriza)/i],
  // Micro
  ['elast','Elasticidade','micro',2,'Quanto a quantidade reage a uma variação de preço, em termos percentuais. Decide quem paga impostos e quanto uma empresa pode subir preços.','ε = (ΔQ/Q) / (ΔP/P)','mat',['tributacao','difeq'],/elasticidade|demanda por|pre[cç]os? (?:sobe|sobem|cai|caem|dispara|despenca)/i],
  ['cournot','Oligopólio e poder de mercado','micro',2,'Poucas empresas que levam em conta a reação das rivais. Com mais concorrentes, o preço se aproxima do custo marginal; fusões e cartéis fazem o caminho inverso.','q₁ = (a − c − b·q₂) / 2b','teo',['schumpeter'],/oligop[oó]lio|cartel|antitruste|monop[oó]lio|\bcade\b|concorr[eê]ncia|fus[aã]o|aquisi[cç][aã]o/i],
  ['capital_humano','Capital humano e salários','micro',2,'Educação e experiência elevam a produtividade e o salário. A equação de Mincer mede esse retorno e é um dos usos mais comuns da regressão.','ln w = β₀ + β₁·educ + β₂·exp − β₃·exp² + ε','teo',['regressao','idh'],/sal[aá]rio|emprego|desemprego|qualifica[cç]|mercado de trabalho|vagas|escolaridade/i],
  // Quantitativos e pesquisa
  ['deriv','Derivadas e otimização','quant',1,'A derivada mede a variação na margem. Maximizar lucro, utilidade ou bem-estar é igualar derivadas: receita marginal = custo marginal, ou usar Lagrange com restrições.','RMg = CMg   ·   ℒ = f(x) − λ·[g(x) − c]','mat',['elast','cournot'],/custo marginal|otimiza|margem bruta|ponto [oó]timo/i],
  ['difeq','Equações em diferença (teia de aranha)','quant',2,'Relacionam o valor de hoje com o de ontem. O modelo da teia de aranha mostra preços agrícolas oscilando porque o plantio reage com atraso.','Pₜ = A − k·Pₜ₋₁ (converge se |k| < 1)','lab',['elast','regressao'],/safra|plantio|colheita|ciclo de pre[cç]os?/i],
  ['regressao','Regressão e inferência','quant',1,'MQO estima a relação média entre variáveis; os testes dizem se ela é estatisticamente diferente de zero. A pergunta central da econometria é se a relação é causal.','β̂ = (XᵀX)⁻¹Xᵀy','mat',['capital_humano','pesquisa'],/econometr|correla[cç][aã]o|estudo (?:mostra|aponta|indica)|pesquisa mostra|levantamento/i],
  ['pesquisa','Projeto de pesquisa','quant',1,'Problema, objetivos, hipótese, referencial, método e dados. Uma boa pergunta de TCC é estreita o bastante para ser respondida com os dados disponíveis.','','teo',['regressao'],/pesquisa do ibge|ipea|dados (?:do|da) (?:ibge|pnad|caged)|levantamento in[eé]dito|estudo do/i]
].map(c => ({id:c[0],name:c[1],disc:c[2],m:c[3],def:c[4],f:c[5],acad:c[6],links:c[7],re:c[8]}));
const MLBL = ['Não vi','Vi em aula','Sei explicar','Sei aplicar'];
/* conceitos de matérias que aparecem mais de uma vez no histórico: entram em "Para reforçar" */
const REFORCO = [...new Set(CURSOS.filter(c => c.repetida && !c.atual).flatMap(c => c.conc))];

/* ---------- empresas (re = como achar nas notícias) ---------- */
const COS = [
  {id:'vale',name:'Vale',tk:'VALE3',pais:'Brasil',reg:'br',setor:'Mineração',re:/\bVALE3\b|mineradora Vale|\bVale (?:lucra|anuncia|registra|produz|reporta|eleva|reduz|tem|vende|investe)/,tese:'Uma das maiores produtoras de minério de ferro do mundo, muito dependente da demanda chinesa. O minério de Carajás chega por ferrovia ao porto de Ponta da Madeira, em São Luís.',tend:['Construção na China','Cobre e níquel para a transição energética','Reparação de Mariana e Brumadinho'],kpis:['Preço realizado do minério','Volume de vendas','Custo caixa por tonelada'],conc:['cepal','regional']},
  {id:'suzb',name:'Suzano',tk:'SUZB3',pais:'Brasil',reg:'br',setor:'Celulose e papel',re:/\bSuzano\b/,tese:'Maior produtora de celulose de eucalipto do mundo, com fábrica em Imperatriz (MA). Exporta a maior parte da produção, então o câmbio pesa muito no resultado.',tend:['Preço da celulose na China','Câmbio','Novas fábricas e endividamento'],kpis:['Preço líquido da celulose','Custo caixa por tonelada','Dívida líquida / EBITDA'],conc:['cepal','wacc']},
  {id:'petr',name:'Petrobras',tk:'PETR4',pais:'Brasil',reg:'br',setor:'Petróleo e gás',re:/\bPetrobras\b|\bPETR4\b/i,tese:'Produz petróleo principalmente no pré-sal, com custo de extração baixo. É controlada pela União, o que pesa nas decisões de preço, investimento e dividendos.',tend:['Produção no pré-sal','Política de dividendos','Exploração na Margem Equatorial'],kpis:['Produção diária','Custo de extração por barril','Dividendos'],conc:['vpl','estado_desenv']},
  {id:'itub',name:'Itaú Unibanco',tk:'ITUB4',pais:'Brasil',reg:'br',setor:'Bancos',re:/\bItaú\b|\bITUB4\b/i,tese:'Maior banco privado do Brasil, conhecido pela rentabilidade alta e consistente.',tend:['Digitalização e corte de agências','Concorrência dos bancos digitais','Crédito com Selic alta'],kpis:['ROE','Inadimplência','Índice de eficiência'],conc:['giro','taylor']},
  {id:'nu',name:'Nubank',tk:'NU',pais:'Brasil',reg:'br',setor:'Banco digital',re:/\bNubank\b|\bNu Holdings\b/i,tese:'Banco digital com mais de 100 milhões de clientes, em expansão no México e na Colômbia. Ganha principalmente com crédito.',tend:['Expansão no México','Crédito com garantia','Custo de servir por cliente'],kpis:['Clientes ativos','Receita por cliente','Inadimplência acima de 90 dias'],conc:['schumpeter','giro']},
  {id:'nvda',name:'Nvidia',tk:'NVDA',pais:'EUA',reg:'eua',setor:'Semicondutores',re:/\bNvidia\b/i,tese:'Vende chips e software (CUDA) que viraram o padrão para treinar e rodar modelos de IA. A maior parte da receita vem de data centers.',tend:['Gasto das big techs em data centers','Chips próprios dos clientes como concorrência','Restrições de exportação para a China'],kpis:['Receita de data center','Margem bruta','Gasto de capital dos grandes clientes'],conc:['schumpeter','sni']},
  {id:'msft',name:'Microsoft',tk:'MSFT',pais:'EUA',reg:'eua',setor:'Software e nuvem',re:/\bMicrosoft\b|\bAzure\b/i,tese:'Software corporativo, nuvem Azure e participação relevante na OpenAI. Integra IA a produtos como Office e GitHub.',tend:['IA vendida como assinatura','Crescimento do Azure','Custo de data centers'],kpis:['Crescimento do Azure','Receita por usuário do Microsoft 365','Gasto de capital'],conc:['schumpeter','vpl']},
  {id:'aapl',name:'Apple',tk:'AAPL',pais:'EUA',reg:'eua',setor:'Hardware e serviços',re:/\bApple\b|\biPhone\b/,tese:'Vende aparelhos, sobretudo o iPhone, e ganha cada vez mais com serviços de margem alta: App Store, iCloud, pagamentos.',tend:['Peso crescente de serviços','IA rodando no próprio aparelho','Produção fora da China'],kpis:['Receita de serviços','Vendas de iPhone por região','Recompra de ações'],conc:['cournot','giro']},
  {id:'googl',name:'Alphabet',tk:'GOOGL',pais:'EUA',reg:'eua',setor:'Internet e IA',re:/\bGoogle\b|\bAlphabet\b|\bYouTube\b/,tese:'Dona do Google: anúncios em busca e no YouTube pagam a maior parte da conta. Google Cloud e modelos de IA próprios crescem.',tend:['IA mudando a busca','Google Cloud','Processos antitruste'],kpis:['Receita de busca','Crescimento da nuvem','Gasto de capital'],conc:['cournot','schumpeter']},
  {id:'amzn',name:'Amazon',tk:'AMZN',pais:'EUA',reg:'eua',setor:'Varejo e nuvem',re:/\bAmazon\b|\bAWS\b/,tese:'Comércio eletrônico em escala global, mas boa parte do lucro vem da AWS, a maior nuvem do mundo.',tend:['AWS e chips próprios','Publicidade dentro da loja','Automação da logística'],kpis:['Crescimento e margem da AWS','Receita de anúncios','Custo de entrega por pacote'],conc:['cournot','giro']},
  {id:'tsm',name:'TSMC',tk:'TSM',pais:'Taiwan',reg:'asia',setor:'Fabricação de chips',re:/\bTSMC\b/,tese:'Fabrica os chips mais avançados do mundo para outras empresas. Nasceu em 1987 de uma iniciativa do governo de Taiwan: um caso clássico de Estado desenvolvimentista.',tend:['Demanda de chips para IA','Fábricas nos EUA e no Japão','Risco geopolítico em Taiwan'],kpis:['Utilização das fábricas','Receita por geração de chip','Margem bruta'],conc:['estado_desenv','sni']},
  {id:'brk',name:'Berkshire Hathaway',tk:'BRK',pais:'EUA',reg:'eua',setor:'Conglomerado',re:/\bBerkshire\b/,tese:'Seguros, ferrovia, energia e participações em ações. Greg Abel assumiu como CEO no início de 2026, no lugar de Warren Buffett.',tend:['Caixa recorde à espera de aquisições','Transição de comando','Uso do caixa das seguradoras para investir'],kpis:['Lucro operacional','Caixa e títulos do Tesouro','Recompra de ações'],conc:['wacc','vpl']}
];

const PEOPLE = [
  {id:'furtado',name:'Celso Furtado',grp:'Economistas',ini:'CF',re:/\bFurtado\b/,papel:'Economista paraibano (1920–2004), autor de Formação Econômica do Brasil (1959) e criador da Sudene.',ideia:'O subdesenvolvimento não é uma etapa anterior ao desenvolvimento, mas uma estrutura própria da periferia, que exige planejamento e ação do Estado.',ler:'Formação Econômica do Brasil; O mito do desenvolvimento econômico',mon:['Debates sobre Nordeste e Sudene','Centro Celso Furtado'],conc:['cepal','regional','psi']},
  {id:'chang',name:'Ha-Joon Chang',grp:'Economistas',ini:'HC',re:/Ha-Joon Chang/,papel:'Economista sul-coreano, professor na SOAS, em Londres.',ideia:'Os países ricos se industrializaram com proteção e política industrial e depois “chutaram a escada” ao recomendar livre comércio aos pobres.',ler:'Chutando a escada; 23 coisas que não nos contaram sobre o capitalismo',mon:['Artigos e entrevistas'],conc:['estado_desenv','psi']},
  {id:'mazzucato',name:'Mariana Mazzucato',grp:'Economistas',ini:'MM',re:/\bMazzucato\b/,papel:'Professora da University College London (UCL), estuda inovação e o papel do Estado.',ideia:'Grande parte das tecnologias do iPhone e da internet nasceu de investimento público de alto risco; o Estado pode criar mercados, não só corrigir falhas.',ler:'O Estado empreendedor; O valor de tudo',mon:['Relatórios sobre política de missões'],conc:['sni','schumpeter']},
  {id:'acemoglu',name:'Daron Acemoglu',grp:'Economistas',ini:'DA',re:/\bAcemoglu\b/,papel:'Professor do MIT. Nobel de Economia em 2024, com Simon Johnson e James Robinson.',ideia:'Instituições inclusivas, que protegem direitos e abrem oportunidades, explicam por que alguns países enriquecem e outros não.',ler:'Por que as nações fracassam (com James Robinson)',mon:['Papers novos','Artigos sobre IA e trabalho'],conc:['idh','estado_desenv']},
  {id:'duflo',name:'Esther Duflo',grp:'Economistas',ini:'ED',re:/\bDuflo\b/,papel:'Professora do MIT. Nobel de Economia em 2019, com Abhijit Banerjee e Michael Kremer.',ideia:'Testar políticas contra a pobreza com experimentos aleatorizados, como se faz em ensaios clínicos.',ler:'Poor Economics (com Abhijit Banerjee)',mon:['Papers novos','J-PAL'],conc:['idh','regressao']},
  {id:'goldin',name:'Claudia Goldin',grp:'Economistas',ini:'CG',re:/Claudia Goldin/,papel:'Professora de Harvard. Nobel de Economia em 2023.',ideia:'A diferença salarial entre homens e mulheres vem hoje sobretudo da maternidade e de empregos que premiam horas longas e inflexíveis.',ler:'Career and Family',mon:['Papers novos'],conc:['capital_humano','regressao']},
  {id:'piketty',name:'Thomas Piketty',grp:'Economistas',ini:'TP',re:/\bPiketty\b/,papel:'Professor da Escola de Economia de Paris.',ideia:'Quando o retorno do capital (r) supera o crescimento da economia (g), a riqueza tende a se concentrar. Defende tributação progressiva sobre o patrimônio.',ler:'O capital no século XXI',mon:['Base de dados sobre desigualdade (WID)'],conc:['tributacao','maisvalia']},
  {id:'buffett',name:'Warren Buffett',grp:'Investidores',ini:'WB',re:/\bBuffett\b/,papel:'Construiu a Berkshire Hathaway e deixou o cargo de CEO no fim de 2025.',ideia:'Comprar boas empresas a preço justo, com margem de segurança e uma vantagem competitiva durável, o “fosso”.',ler:'Cartas anuais aos acionistas da Berkshire',mon:['Cartas anuais','Reunião anual de acionistas','Carteira declarada à SEC (13F)'],conc:['vpl','wacc']},
  {id:'dalio',name:'Ray Dalio',grp:'Investidores',ini:'RD',re:/\bDalio\b/,papel:'Fundador da Bridgewater, uma das maiores gestoras de fundos multimercado do mundo.',ideia:'A economia se move em ciclos de dívida de curto e de longo prazo; a história ajuda a reconhecer em que ponto do ciclo estamos.',ler:'Princípios; Princípios para lidar com grandes crises de dívida',mon:['Artigos e posts','Entrevistas'],conc:['capficticio','divida']},
  {id:'taleb',name:'Nassim Taleb',grp:'Investidores',ini:'NT',re:/\bTaleb\b/,papel:'Ensaísta, ex-operador de opções e estudioso de risco e probabilidade.',ideia:'Eventos raros e extremos dominam a história e os mercados. Modelos que supõem distribuição normal subestimam esse risco.',ler:'A lógica do cisne negro; Antifrágil',mon:['Livros e artigos técnicos'],conc:['regressao','capficticio']},
  {id:'lemann',name:'Jorge Paulo Lemann',grp:'Empresários',ini:'JL',re:/\bLemann\b/,papel:'Cofundador do Banco Garantia e da 3G Capital, por trás de Ambev, AB InBev e Burger King.',ideia:'Meritocracia, “sonho grande” e controle rígido de custos com orçamento base zero.',ler:'Sonho Grande, de Cristiane Correa',mon:['Movimentos da 3G Capital'],conc:['orcamento','giro']},
  {id:'huang',name:'Jensen Huang',grp:'Empresários',ini:'JH',re:/Jensen Huang/,papel:'Cofundador e CEO da Nvidia desde 1993.',ideia:'Apostou cedo que placas de vídeo serviriam para muito além de games: ciência, simulação e IA.',ler:'Apresentações anuais da conferência GTC',mon:['Teleconferências de resultados','Apresentações da GTC'],conc:['schumpeter','sni']},
  {id:'nadella',name:'Satya Nadella',grp:'Empresários',ini:'SN',re:/\bNadella\b/,papel:'CEO da Microsoft desde 2014.',ideia:'Trocar a cultura do “sabe-tudo” pela do “aprende-tudo” e apostar na nuvem antes dos concorrentes.',ler:'Aperte o F5',mon:['Cartas aos acionistas','Teleconferências de resultados'],conc:['schumpeter','vpl']},
  {id:'musk',name:'Elon Musk',grp:'Empresários',ini:'EM',re:/\bMusk\b/,papel:'À frente de Tesla, SpaceX e xAI.',ideia:'Raciocinar por primeiros princípios: decompor o custo de um produto até as matérias-primas e reconstruí-lo do zero.',ler:'Elon Musk, de Walter Isaacson',mon:['Resultados da Tesla','Lançamentos da SpaceX'],conc:['schumpeter','deriv']},
  {id:'satoshi',name:'Satoshi Nakamoto',grp:'Cripto',ini:'SN',re:/\bSatoshi\b/,papel:'Criador anônimo do Bitcoin. A identidade nunca foi confirmada.',ideia:'Dinheiro eletrônico ponto a ponto, sem intermediário, com oferta máxima fixa em 21 milhões de unidades.',ler:'Bitcoin: A Peer-to-Peer Electronic Cash System (2008)',mon:['Discussões sobre o protocolo','Dados da rede'],conc:['capficticio','elast']}
];

/* ---------- exercícios (primeiro os das matérias deste semestre) ---------- */
const PROBS = [
  {id:'divida',title:'Quanto de superávit estabiliza a dívida?',conc:'divida',materia:'Economia do Setor Público',enun:'A dívida bruta está em 78% do PIB, o juro real médio é 7% ao ano e o PIB real cresce 2% ao ano. Qual superávit primário, em % do PIB, mantém a dívida/PIB estável?',unit:'% do PIB',ans:(0.07-0.02)/1.02*78,tol:.05,
   steps:['Condição de estabilidade: s* = [(r − g)/(1 + g)]·b','(0,07 − 0,02) / 1,02 = <b>0,0490</b>','s* = 0,0490 × 78 = <b>3,82% do PIB</b>','Leitura: com juro real tão acima do crescimento, o esforço fiscal necessário é alto. Cada ponto a menos de juro real alivia cerca de 0,76 p.p. do PIB.']},
  {id:'incid',title:'Quem paga o imposto?',conc:'tributacao',materia:'Economia do Setor Público',enun:'O governo cria um imposto de R$ 10 por unidade. A elasticidade da oferta é 1,5 e a da demanda é −0,5. Quanto do imposto (em R$) recai sobre o consumidor?',unit:'R$',ans:7.5,tol:.05,
   steps:['Parcela do consumidor = εₛ / (εₛ − ε_d) = 1,5 / (1,5 + 0,5) = <b>75%</b>','75% × R$ 10 = <b>R$ 7,50</b> para o consumidor; R$ 2,50 para o produtor','Leitura: quem é menos sensível ao preço (aqui, a demanda) arca com a maior parte, não importa quem recolhe.']},
  {id:'wacc',title:'Custo de capital de uma empresa',conc:'wacc',materia:'Adm. Financeira e Orçamentária I',enun:'Uma empresa é financiada 60% com capital próprio (custo de 18% a.a.) e 40% com dívida (custo de 14% a.a.). A alíquota de IR e CSLL é 34%. Qual o WACC, em %?',unit:'%',ans:.6*18+.4*14*.66,tol:.05,
   steps:['Custo da dívida após impostos: 14% × (1 − 0,34) = <b>9,24%</b>','WACC = 0,6 × 18% + 0,4 × 9,24% = 10,8% + 3,70% = <b>14,50%</b>','Leitura: projetos dessa empresa precisam render mais de 14,5% ao ano para criar valor.']},
  {id:'ciclo',title:'Ciclo financeiro',conc:'giro',materia:'Adm. Financeira e Orçamentária I',enun:'Uma empresa estoca mercadorias por 45 dias, recebe dos clientes em 30 dias e paga fornecedores em 40 dias. Qual o ciclo financeiro, em dias?',unit:'dias',ans:35,tol:.5,
   steps:['Ciclo operacional = PMRE + PMRV = 45 + 30 = <b>75 dias</b>','Ciclo financeiro = 75 − PMPF = 75 − 40 = <b>35 dias</b>','Leitura: por 35 dias a empresa financia a operação com recursos próprios ou empréstimos. Encurtar o prazo de clientes ou alongar o de fornecedores libera caixa.']},
  {id:'lucro',title:'Taxa de lucro e composição orgânica',conc:'tqtl',materia:'Economia Marxista II',enun:'Um capital tem c = 600 (capital constante), v = 200 (capital variável) e produz m = 200 de mais-valia. Qual a taxa de lucro, em %?',unit:'%',ans:25,tol:.1,
   steps:['Taxa de mais-valia: e = m/v = 200/200 = <b>100%</b>','Taxa de lucro: r = m/(c + v) = 200/800 = <b>25%</b>','Se a mecanização elevar c para 800 com a mesma exploração: r = 200/1000 = 20%. É a tendência à queda da taxa de lucro.']},
  {id:'vpl',title:'Vale a pena investir?',conc:'vpl',materia:'Adm. Financeira e Orçamentária I',enun:'Um projeto custa R$ 100 mil hoje e gera R$ 30 mil por ano durante 5 anos. Com taxa de desconto de 12% ao ano, qual o VPL (em R$ mil)?',unit:'R$ mil',ans:8.14,tol:.06,
   steps:['Fator de anuidade: [1 − 1,12⁻⁵] ÷ 0,12 = <b>3,6048</b>','Valor presente dos fluxos: 30 × 3,6048 = <b>108,14</b>','VPL = 108,14 − 100 = <b>8,14 mil</b>. Positivo: o projeto cria valor.']},
  {id:'uip',title:'Quanto o mercado “espera” para o dólar?',conc:'paridade',materia:'Teoria Macroeconômica III',enun:'Suponha juro de 14% ao ano no Brasil, 3,5% nos EUA e dólar a R$ 5,40 hoje. Pela paridade descoberta de juros, qual o dólar esperado daqui a um ano?',unit:'R$',ans:5.40*1.14/1.035,tol:.02,
   steps:['Razão dos juros: 1,14 ÷ 1,035 = <b>1,1014</b>','Dólar esperado: 5,40 × 1,1014 = <b>R$ 5,95</b>','Leitura: o mercado precisaria esperar uma desvalorização de cerca de 10% do real para as duas aplicações renderem o mesmo.']},
  {id:'mono',title:'Preço que maximiza o lucro',conc:'deriv',materia:'Matemática Econômica I',enun:'Um monopolista enfrenta demanda P = 100 − 2Q e tem custo marginal constante de 20. Qual o preço que maximiza o lucro?',unit:'R$',ans:60,tol:.5,
   steps:['Receita total: RT = 100Q − 2Q²','Receita marginal (derivada): RMg = 100 − 4Q','RMg = CMg → 100 − 4Q = 20 → <b>Q = 20</b>','Preço: P = 100 − 2·20 = <b>60</b>. Lucro = (60 − 20)·20 = 800.']}
];

const THEORY = [
  {name:'Bens públicos (Samuelson)',conc:'bens',eq:'Σ TMgS<sub>i</sub> = TMgT',int:'Como todos consomem a mesma quantidade de um bem público, a provisão ótima soma a disposição a pagar de cada um. O mercado subprovê porque cada um tenta pegar carona.',hip:'Preferências conhecidas e financiamento sem distorção.',lim:'Ninguém revela a verdadeira disposição a pagar; impostos para financiar geram peso morto.'},
  {name:'Dinâmica da dívida pública',conc:'divida',eq:'Δb = [(r − g)/(1 + g)]·b − s',int:'A dívida/PIB cresce sozinha quando o juro real supera o crescimento. O superávit primário é o que segura essa bola de neve.',hip:'Juro e crescimento médios constantes.',lim:'r, g e s dependem uns dos outros: um ajuste forte pode derrubar g.'},
  {name:'Incidência tributária',conc:'tributacao',eq:'parcela do consumidor = ε<sub>s</sub> / (ε<sub>s</sub> − ε<sub>d</sub>)',int:'O lado menos elástico do mercado arca com a maior parte do imposto, seja quem for que o recolhe.',hip:'Concorrência perfeita, equilíbrio parcial.',lim:'Em oligopólio e no longo prazo, o repasse pode ser diferente.'},
  {name:'Centro-periferia (Prebisch-Singer)',conc:'cepal',eq:'TT = P<sub>x</sub> / P<sub>m</sub> ↓ no longo prazo',int:'Ganhos de produtividade na indústria do centro viram salários e lucros; na periferia, viram preços menores de commodities. Daí a defesa da industrialização.',hip:'Demanda por primários menos elástica à renda que a por manufaturados.',lim:'Ciclos de preços altos de commodities (como nos anos 2000) contrariam a tendência por longos períodos.'},
  {name:'Tendência à queda da taxa de lucro',conc:'tqtl',eq:'r = e / (1 + q), &nbsp; q = c / v',int:'A concorrência leva à mecanização, que eleva a composição orgânica q. Se a taxa de mais-valia e não sobe na mesma proporção, a taxa de lucro cai.',hip:'Só o trabalho vivo cria valor; mecanização poupa trabalho.',lim:'As contratendências (mais exploração, capital constante mais barato, comércio exterior) podem dominar por décadas; a evidência empírica é debatida.'},
  {name:'Sistemas nacionais de inovação',conc:'sni',eq:'',int:'Inovação não é só um empresário genial: depende de universidades, crédito de longo prazo, compras públicas e da interação entre esses atores.',hip:'Conhecimento é cumulativo e local.',lim:'Difícil de medir e de copiar: instituições não se transplantam.'},
  {name:'Modelo IS-LM',conc:'islm',eq:'IS: Y = C(Y − T) + I(r) + G &nbsp;·&nbsp; LM: M/P = L(Y, r)',int:'Gasto público desloca a IS para a direita e eleva produto e juros; expansão monetária desloca a LM e reduz juros.',hip:'Preços fixos no curto prazo; economia fechada.',lim:'Bancos centrais hoje fixam juros, não a oferta de moeda: o IS-MP descreve melhor.'},
  {name:'Regra de Taylor',conc:'taylor',eq:'i = r* + π + 0,5·(π − π*) + 0,5·(y − y*)',int:'O banco central sobe o juro mais que a inflação quando ela passa da meta, para elevar o juro real e esfriar a economia.',hip:'Juro neutro e hiato do produto conhecidos.',lim:'Nenhum dos dois é observado diretamente; as estimativas mudam muito.'},
  {name:'Paridade descoberta de juros',conc:'paridade',eq:'E[S<sub>t+1</sub>] / S<sub>t</sub> = (1 + i) / (1 + i*)',int:'A diferença de juros entre dois países deveria ser compensada pela variação esperada do câmbio.',hip:'Investidores neutros ao risco, capital livre.',lim:'Falha com frequência na prática, e por isso o carry trade lucra na média.'},
  {name:'Teia de aranha',conc:'difeq',eq:'P<sub>t</sub> = A − k·P<sub>t−1</sub>',int:'Produtores plantam olhando o preço da safra anterior. O preço oscila em torno do equilíbrio e só converge se a oferta reagir menos que a demanda (k &lt; 1).',hip:'Expectativas ingênuas: o produtor espera que o preço de amanhã seja igual ao de hoje.',lim:'Produtores reais usam mercados futuros e aprendem com o tempo.'}
];

const CASES = [
  {id:'coreia',name:'Coreia do Sul × Brasil',per:'1960 – 1990',materia:'Estratégias de Desenvolvimento Comparadas',res:'Em 1960 a renda per capita brasileira era maior que a sul-coreana. Os dois países usaram proteção, crédito estatal e grandes grupos nacionais. A Coreia condicionou o apoio a metas de exportação e investiu pesado em educação básica; o Brasil voltou a indústria ao mercado interno e se endividou em dólar. Nos anos 1980, com a crise da dívida, a Coreia passou à frente.',fw:'Estado desenvolvimentista: autonomia inserida (Evans) e disciplina recíproca (Amsden)',q:'Por que instrumentos parecidos (proteção e crédito dirigido) deram resultados tão diferentes?',conc:['estado_desenv','psi','sni']},
  {id:'real',name:'Plano Real',per:'1993 – 1999',materia:'Economia Brasileira Contemporânea I',res:'Depois de cinco planos fracassados, a URV indexou todos os preços a uma unidade estável por alguns meses e, em julho de 1994, virou a nova moeda. A inflação caiu de quatro dígitos para um dígito com âncora cambial e juros altos. A crise de 1999 forçou a flutuação do câmbio e a adoção do tripé.',fw:'Inflação inercial e credibilidade',q:'Por que o congelamento de preços falhou nos planos anteriores e a URV funcionou?',conc:['plano_real','taylor','paridade']},
  {id:'embrapa',name:'Embrapa e o Cerrado',per:'1973 – hoje',materia:'Inovação e Desenvolvimento',res:'Criada em 1973, a Embrapa desenvolveu correção de solos ácidos e cultivares de soja adaptadas ao clima tropical. O Cerrado, antes considerado impróprio, virou uma das maiores regiões produtoras de grãos do mundo, inclusive no sul do Maranhão (MATOPIBA).',fw:'Sistema nacional de inovação setorial',q:'Que papel o Estado teve, e daria para repetir esse modelo em outro setor?',conc:['sni','cepal','regional']},
  {id:'kodak',name:'Kodak e a câmera digital',per:'1975 – 2012',materia:'Inovação e Desenvolvimento',res:'Um engenheiro da Kodak, Steve Sasson, construiu um dos primeiros protótipos de câmera digital em 1975. A empresa, que lucrava com filme e revelação, tratou a tecnologia com cautela para não canibalizar o negócio principal. Quando a fotografia digital se popularizou, a Kodak ficou para trás e pediu recuperação judicial em 2012.',fw:'Destruição criadora e dilema da inovação',q:'Se você fosse CEO em 1990, como financiaria o digital sem destruir o caixa do filme?',conc:['schumpeter','vpl']},
  {id:'nvidia',name:'Nvidia e a aposta na CUDA',per:'2006 – 2023',materia:'Inovação e Desenvolvimento',res:'Em 2006 a Nvidia lançou a CUDA, que permitia usar placas de vídeo para cálculos gerais. Por anos o retorno foi pequeno. Em 2012, uma rede neural treinada em GPUs da Nvidia (AlexNet) venceu uma competição de visão computacional, e a plataforma virou o padrão da IA.',fw:'Plataformas e efeitos de rede',q:'Como avaliar um investimento cujo retorno é incerto e distante?',conc:['vpl','schumpeter','cournot']},
  {id:'nubank',name:'Nubank: crescer com custo baixo',per:'2013 – 2021',materia:'Adm. Financeira e Orçamentária I',res:'Fundado em 2013 com um cartão sem anuidade gerenciado pelo aplicativo, o Nubank cresceu muito por indicação de clientes, com custo de aquisição baixo. Abriu capital na Bolsa de Nova York em 2021.',fw:'Economia unitária: custo de aquisição (CAC) × valor do cliente (LTV)',q:'Que métricas mostram se crescer rápido está criando ou destruindo valor?',conc:['vpl','giro','schumpeter']},
  {id:'ambev',name:'Ambev e o orçamento base zero',per:'1999 – 2019',materia:'Adm. Financeira e Orçamentária I',res:'A fusão de Brahma e Antarctica criou a Ambev em 1999. O grupo levou o corte de custos, o orçamento base zero e a meritocracia a aquisições cada vez maiores, até a compra da Anheuser-Busch em 2008. O modelo mostrou limites na Kraft Heinz, que em 2019 reconheceu uma baixa contábil bilionária no valor de suas marcas.',fw:'Orçamento base zero × investimento em marcas',q:'Cortar custos aumenta o lucro hoje. Quando isso destrói valor amanhã?',conc:['orcamento','giro','wacc']}
];

const FLASH = [
  ['Condição de Samuelson para bens públicos?','A soma das taxas marginais de substituição de todos os consumidores deve igualar a taxa marginal de transformação.'],
  ['Quem paga um imposto?','O lado do mercado menos elástico arca com a maior parte, não importa quem recolhe.'],
  ['Quando a dívida/PIB se estabiliza?','Quando o superávit primário cobre (r − g)/(1 + g) vezes a dívida.'],
  ['O que são PPA, LDO e LOA?','Plano plurianual (4 anos), lei de diretrizes (metas do ano seguinte) e lei orçamentária anual (receitas e despesas).'],
  ['O que é a composição orgânica do capital?','A razão c/v entre capital constante e capital variável.'],
  ['Tese de Prebisch-Singer?','Os preços de primários tendem a cair em relação aos industrializados, piorando os termos de troca da periferia.'],
  ['O que é um sistema nacional de inovação?','A rede de empresas, universidades, governo e financiamento que gera e difunde tecnologia num país.'],
  ['Fórmula do WACC?','E/V·Kₑ + D/V·K_d·(1 − T).'],
  ['O que desloca a IS para a direita?','Mais gasto público, menos impostos ou mais confiança para investir.'],
  ['Quando a teia de aranha converge?','Quando |k| &lt; 1: a oferta reage menos ao preço que a demanda.']
];

const TRILHAS = [
  ['Setor público e planejamento','Orçamento, tributação e avaliação de políticas em governos, IPEA, Tesouro e tribunais de contas.',['Finanças públicas','Orçamento','Econometria','Redação técnica'],['divida','tributacao','orcamento']],
  ['Desenvolvimento e inovação','Bancos de desenvolvimento (BNDES, Banco do Nordeste), agências (Finep, Sudene) e organismos como a CEPAL.',['Economia do desenvolvimento','Avaliação de projetos','Inglês'],['estado_desenv','sni','vpl']],
  ['Pesquisa e pós-graduação','Mestrado pelo exame da ANPEC e carreira acadêmica.',['Micro','Macro','Matemática','Estatística','Economia brasileira'],['deriv','regressao','islm']],
  ['Finanças corporativas','Análise financeira, orçamento empresarial e avaliação de investimentos.',['Contabilidade','Excel','Valuation'],['wacc','giro','vpl']]
];
const CERT = [
  ['Exame ANPEC','ANPEC','Seleção unificada para mestrado e doutorado em economia: provas de Micro, Macro, Matemática, Estatística e Economia Brasileira'],
  ['CPA-20','ANBIMA','Para atender investidores no mercado financeiro'],
  ['CEA','ANBIMA','Especialista em investimentos, consultoria a clientes'],
  ['CFA','CFA Institute','Análise de investimentos, reconhecida no mundo todo (3 níveis)']
];

/* ---------- temas acompanhados nas tendências ---------- */
const THEMES = [
  ['Juros e Copom',/copom|\bselic\b|juros|\bfed\b|rate cut/i],
  ['Inflação',/infla[cç]|\bipca\b|\bcpi\b/i],
  ['Fiscal e dívida pública',/\bfiscal\b|d[ií]vida p[uú]blica|arcabou[cç]o|d[eé]ficit|prim[aá]rio/i],
  ['Orçamento e gasto público',/or[cç]ament|emendas|contingenc|gasto p[uú]blico|\bldo\b|\bloa\b/i],
  ['Reforma tributária e impostos',/reforma tribut|imposto|\bibs\b|\bcbs\b|isen[cç][aã]o/i],
  ['Nordeste e Maranhão',/nordeste|maranh[aã]o|s[aã]o lu[ií]s|sudene|imperatriz/i],
  ['Política industrial e inovação',/pol[ií]tica industrial|nova ind[uú]stria|inova[cç]|bndes|finep/i],
  ['IA e agentes',/intelig[eê]ncia artificial|\bia\b|\bai\b|agentes? de|openai|anthropic|\bllm/i],
  ['Bitcoin e cripto',/bitcoin|cripto|crypto|stablecoin|ethereum/i],
  ['Safra e grãos',/safra|soja|milho|gr[aã]os|colheita/i],
  ['Petróleo e energia',/petr[oó]leo|brent|opep|opec|energia/i],
  ['Tarifas e comércio',/tarif|guerra comercial|trade war|exporta[cç]/i],
  ['China',/china|chin[eê]s|chinesa/i],
  ['Mercado de trabalho',/desemprego|emprego|vagas|payroll|jobs/i],
  ['Pobreza e desigualdade',/pobreza|desigualdade|bolsa fam[ií]lia|fome/i]
];
