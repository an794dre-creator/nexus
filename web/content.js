/* Conteúdo fixo do NEXUS: perfis, conceitos da formação, exercícios, teoria e casos.
   Edite à vontade: é aqui que entram as suas matérias. */

const AREAS = {
  macro: ['Macro Brasil', 'a1'], global: ['Economia global', 'a1'], mercados: ['Mercados', ''],
  empresas: ['Empresas', ''], ia: ['IA e tecnologia', 'a2'], cripto: ['Cripto', 'a1'],
  agro: ['Agro', 'a3'], politica: ['Política', ''], carreira: ['Carreira', 'a2']
};

/* re = expressão usada para achar a empresa ou pessoa nas notícias */
const COS = [
  {id:'nvda',name:'Nvidia',tk:'NVDA',pais:'EUA',reg:'eua',setor:'Semicondutores',re:/\bNvidia\b/i,tese:'Vende chips e software (CUDA) que viraram o padrão para treinar e rodar modelos de IA. A maior parte da receita vem de data centers.',tend:['Gasto das big techs em data centers','Chips próprios dos clientes como concorrência','Restrições de exportação para a China'],kpis:['Receita de data center','Margem bruta','Gasto de capital dos grandes clientes'],conc:['inovacao','porter']},
  {id:'msft',name:'Microsoft',tk:'MSFT',pais:'EUA',reg:'eua',setor:'Software e nuvem',re:/\bMicrosoft\b|\bAzure\b/i,tese:'Software corporativo, nuvem Azure e participação relevante na OpenAI. Integra IA a produtos como Office e GitHub.',tend:['IA vendida como assinatura','Crescimento do Azure','Custo de data centers'],kpis:['Crescimento do Azure','Receita por usuário do Microsoft 365','Gasto de capital'],conc:['porter','vpl']},
  {id:'aapl',name:'Apple',tk:'AAPL',pais:'EUA',reg:'eua',setor:'Hardware e serviços',re:/\bApple\b|\biPhone\b/,tese:'Vende aparelhos, sobretudo o iPhone, e ganha cada vez mais com serviços de margem alta: App Store, iCloud, pagamentos.',tend:['Peso crescente de serviços','IA rodando no próprio aparelho','Produção fora da China'],kpis:['Receita de serviços','Vendas de iPhone por região','Recompra de ações'],conc:['porter','dupont']},
  {id:'googl',name:'Alphabet',tk:'GOOGL',pais:'EUA',reg:'eua',setor:'Internet e IA',re:/\bGoogle\b|\bAlphabet\b|\bYouTube\b/,tese:'Dona do Google: anúncios em busca e no YouTube pagam a maior parte da conta. Google Cloud e modelos de IA próprios crescem.',tend:['IA mudando a busca','Google Cloud','Processos antitruste'],kpis:['Receita de busca','Crescimento da nuvem','Gasto de capital'],conc:['falhas','cournot']},
  {id:'amzn',name:'Amazon',tk:'AMZN',pais:'EUA',reg:'eua',setor:'Varejo e nuvem',re:/\bAmazon\b|\bAWS\b/,tese:'Comércio eletrônico em escala global, mas boa parte do lucro vem da AWS, a maior nuvem do mundo.',tend:['AWS e chips próprios','Publicidade dentro da loja','Automação da logística'],kpis:['Crescimento e margem da AWS','Receita de anúncios','Custo de entrega por pacote'],conc:['dupont','porter']},
  {id:'meta',name:'Meta',tk:'META',pais:'EUA',reg:'eua',setor:'Redes sociais',re:/Meta Platforms|Zuckerberg|\bMeta's\b|\bInstagram\b/,tese:'Facebook, Instagram e WhatsApp: vive de anúncios e investe pesado em IA e em óculos inteligentes.',tend:['IA para segmentar anúncios','Monetização do WhatsApp','Gastos com realidade aumentada'],kpis:['Receita por usuário','Usuários ativos diários','Prejuízo da divisão Reality Labs'],conc:['vpl','porter']},
  {id:'tsm',name:'TSMC',tk:'TSM',pais:'Taiwan',reg:'asia',setor:'Fabricação de chips',re:/\bTSMC\b/,tese:'Fabrica os chips mais avançados do mundo para outras empresas, como Apple e Nvidia, sem marca própria de produto.',tend:['Demanda de chips para IA','Fábricas nos EUA e no Japão','Risco geopolítico em Taiwan'],kpis:['Utilização das fábricas','Receita por geração de chip','Margem bruta'],conc:['porter','cournot']},
  {id:'brk',name:'Berkshire Hathaway',tk:'BRK',pais:'EUA',reg:'eua',setor:'Conglomerado',re:/\bBerkshire\b/,tese:'Seguros, ferrovia, energia e participações em ações. Greg Abel assumiu como CEO no início de 2026, no lugar de Warren Buffett.',tend:['Caixa recorde à espera de aquisições','Transição de comando','Uso do caixa das seguradoras para investir'],kpis:['Lucro operacional','Caixa e títulos do Tesouro','Recompra de ações'],conc:['valuation','capm']},
  {id:'petr',name:'Petrobras',tk:'PETR4',pais:'Brasil',reg:'br',setor:'Petróleo e gás',re:/\bPetrobras\b|\bPETR4\b/i,tese:'Produz petróleo principalmente no pré-sal, com custo de extração baixo. É controlada pela União, o que pesa nas decisões de preço e investimento.',tend:['Produção no pré-sal','Política de dividendos','Exploração na Margem Equatorial'],kpis:['Produção diária','Custo de extração por barril','Dividendos'],conc:['vpl','valuation']},
  {id:'itub',name:'Itaú Unibanco',tk:'ITUB4',pais:'Brasil',reg:'br',setor:'Bancos',re:/\bItaú\b|\bITUB4\b/i,tese:'Maior banco privado do Brasil, conhecido pela rentabilidade alta e consistente.',tend:['Digitalização e corte de agências','Concorrência dos bancos digitais','Crédito com Selic alta'],kpis:['ROE','Inadimplência','Índice de eficiência'],conc:['dupont','pdd']},
  {id:'vale',name:'Vale',tk:'VALE3',pais:'Brasil',reg:'br',setor:'Mineração',re:/\bVALE3\b|mineradora Vale|\bVale (?:lucra|anuncia|registra|produz|reporta|eleva|reduz|tem|vende)/,tese:'Uma das maiores produtoras de minério de ferro do mundo, muito dependente da demanda chinesa.',tend:['Construção na China','Cobre e níquel para a transição energética','Reparação de Mariana e Brumadinho'],kpis:['Preço realizado do minério','Volume de vendas','Custo caixa por tonelada'],conc:['termos','elast']},
  {id:'nu',name:'Nubank',tk:'NU',pais:'Brasil',reg:'br',setor:'Banco digital',re:/\bNubank\b|\bNu Holdings\b/i,tese:'Banco digital com mais de 100 milhões de clientes, em expansão no México e na Colômbia. Ganha principalmente com crédito.',tend:['Expansão no México','Crédito com garantia','Custo de servir por cliente'],kpis:['Clientes ativos','Receita por cliente','Inadimplência acima de 90 dias'],conc:['pdd','dupont']}
];

const PEOPLE = [
  {id:'buffett',name:'Warren Buffett',grp:'Investidores',ini:'WB',re:/\bBuffett\b/,papel:'Construiu a Berkshire Hathaway e deixou o cargo de CEO no fim de 2025.',ideia:'Comprar boas empresas a preço justo, com margem de segurança e uma vantagem competitiva durável, o “fosso”.',ler:'Cartas anuais aos acionistas da Berkshire',mon:['Cartas anuais','Reunião anual de acionistas','Carteira declarada à SEC (13F)'],conc:['valuation','porter']},
  {id:'dalio',name:'Ray Dalio',grp:'Investidores',ini:'RD',re:/\bDalio\b/,papel:'Fundador da Bridgewater, uma das maiores gestoras de fundos multimercado do mundo.',ideia:'A economia se move em ciclos de dívida de curto e de longo prazo; a história ajuda a reconhecer em que ponto do ciclo estamos.',ler:'Princípios; Princípios para lidar com grandes crises de dívida',mon:['Artigos e posts','Entrevistas'],conc:['transm','series']},
  {id:'taleb',name:'Nassim Taleb',grp:'Investidores',ini:'NT',re:/\bTaleb\b/,papel:'Ensaísta, ex-operador de opções e estudioso de risco e probabilidade.',ideia:'Eventos raros e extremos dominam a história e os mercados. Modelos que supõem distribuição normal subestimam esse risco.',ler:'A lógica do cisne negro; Antifrágil',mon:['Livros e artigos técnicos'],conc:['series','capm']},
  {id:'lemann',name:'Jorge Paulo Lemann',grp:'Empresários',ini:'JL',re:/\bLemann\b/,papel:'Cofundador do Banco Garantia e da 3G Capital, por trás de Ambev, AB InBev e Burger King.',ideia:'Meritocracia, “sonho grande” e controle rígido de custos com orçamento base zero.',ler:'Sonho Grande, de Cristiane Correa',mon:['Movimentos da 3G Capital'],conc:['dupont','valuation']},
  {id:'huang',name:'Jensen Huang',grp:'Empresários',ini:'JH',re:/Jensen Huang/,papel:'Cofundador e CEO da Nvidia desde 1993.',ideia:'Apostou cedo que placas de vídeo serviriam para muito além de games: ciência, simulação e IA.',ler:'Apresentações anuais da conferência GTC',mon:['Teleconferências de resultados','Apresentações da GTC'],conc:['inovacao','porter']},
  {id:'nadella',name:'Satya Nadella',grp:'Empresários',ini:'SN',re:/\bNadella\b/,papel:'CEO da Microsoft desde 2014.',ideia:'Trocar a cultura do “sabe-tudo” pela do “aprende-tudo” e apostar na nuvem antes dos concorrentes.',ler:'Aperte o F5',mon:['Cartas aos acionistas','Teleconferências de resultados'],conc:['inovacao','vpl']},
  {id:'musk',name:'Elon Musk',grp:'Empresários',ini:'EM',re:/\bMusk\b/,papel:'À frente de Tesla, SpaceX e xAI.',ideia:'Raciocinar por primeiros princípios: decompor o custo de um produto até as matérias-primas e reconstruí-lo do zero.',ler:'Elon Musk, de Walter Isaacson',mon:['Resultados da Tesla','Lançamentos da SpaceX'],conc:['inovacao','deriv']},
  {id:'acemoglu',name:'Daron Acemoglu',grp:'Economistas',ini:'DA',re:/\bAcemoglu\b/,papel:'Professor do MIT. Nobel de Economia em 2024, com Simon Johnson e James Robinson.',ideia:'Instituições inclusivas, que protegem direitos e abrem oportunidades, explicam por que alguns países enriquecem e outros não.',ler:'Por que as nações fracassam (com James Robinson)',mon:['Papers novos','Artigos sobre IA e trabalho'],conc:['causal','solow']},
  {id:'duflo',name:'Esther Duflo',grp:'Economistas',ini:'ED',re:/\bDuflo\b/,papel:'Professora do MIT. Nobel de Economia em 2019, com Abhijit Banerjee e Michael Kremer.',ideia:'Testar políticas contra a pobreza com experimentos aleatorizados, como se faz em ensaios clínicos.',ler:'Poor Economics (com Abhijit Banerjee)',mon:['Papers novos','J-PAL'],conc:['causal','regressao']},
  {id:'goldin',name:'Claudia Goldin',grp:'Economistas',ini:'CG',re:/Claudia Goldin/,papel:'Professora de Harvard. Nobel de Economia em 2023.',ideia:'A diferença salarial entre homens e mulheres vem hoje sobretudo da maternidade e de empregos que premiam horas longas e inflexíveis.',ler:'Career and Family',mon:['Papers novos'],conc:['regressao','causal']},
  {id:'piketty',name:'Thomas Piketty',grp:'Economistas',ini:'TP',re:/\bPiketty\b/,papel:'Professor da Escola de Economia de Paris.',ideia:'Quando o retorno do capital (r) supera o crescimento da economia (g), a riqueza tende a se concentrar.',ler:'O capital no século XXI',mon:['Base de dados sobre desigualdade (WID)'],conc:['solow','series']},
  {id:'satoshi',name:'Satoshi Nakamoto',grp:'Cripto',ini:'SN',re:/\bSatoshi\b/,papel:'Criador anônimo do Bitcoin. A identidade nunca foi confirmada.',ideia:'Dinheiro eletrônico ponto a ponto, sem intermediário, com oferta máxima fixa em 21 milhões de unidades.',ler:'Bitcoin: A Peer-to-Peer Electronic Cash System (2008)',mon:['Discussões sobre o protocolo','Dados da rede'],conc:['elast','falhas']}
];

/* Formação: troque pelas disciplinas do seu curso */
const DISC = [['micro','Microeconomia','Micro'],['macro','Macroeconomia','Macro'],['calc','Cálculo e otimização','Cálculo'],['est','Estatística e econometria','Econometria'],['fin','Finanças','Finanças'],['cont','Contabilidade','Contábil'],['inter','Economia internacional','Internac.'],['estr','Estratégia e administração','Estratégia']];

/* [id, nome, disciplina, domínio inicial 0-3, definição, fórmula, aba da academia, conexões, regex nas notícias] */
const CONC = [
  ['elast','Elasticidade','micro',2,'Mede quanto a quantidade demandada (ou ofertada) reage a uma variação de preço, em termos percentuais.','ε = (ΔQ/Q) / (ΔP/P)','mat',['difeq','termos'],/elasticidade|demanda por|pre[cç]os? (?:sobe|sobem|cai|caem|dispara|despenca)/i],
  ['cournot','Cournot e oligopólio','micro',1,'Empresas escolhem quanto produzir considerando a produção das rivais. Com mais concorrentes, o preço se aproxima do custo marginal.','q₁ = (a − c − b·q₂) / 2b','teo',['deriv'],/oligop[oó]lio|cartel|antitruste|monop[oó]lio|\bcade\b|concorr[eê]ncia/i],
  ['falhas','Falhas de mercado','micro',2,'Situações em que o mercado sozinho não chega ao resultado eficiente: externalidades, bens públicos, assimetria de informação e poder de mercado.','','teo',[],/regula[cç][aã]o|regulament|externalidade|polui[cç][aã]o|antitruste|subs[ií]dio/i],
  ['taylor','Regra de Taylor','macro',1,'Regra que descreve como o banco central ajusta o juro conforme a inflação e o hiato do produto.','i = r* + π + 0,5(π − π*) + 0,5(y − y*)','teo',['transm','series'],/copom|\bselic\b|\bfed\b|federal reserve|taxa de juros|interest rates?|rate cut|banco central/i],
  ['solow','Modelo de Solow','macro',2,'Modelo de crescimento em que poupança e capital elevam a renda com retornos decrescentes; só a tecnologia sustenta o crescimento per capita no longo prazo.','Δk = s·f(k) − (n + δ)·k','teo',[],/produtividade|productivity|crescimento econ[oô]mico|\bpib\b|\bgdp\b/i],
  ['transm','Transmissão monetária','macro',2,'Canais pelos quais a Selic afeta a economia: crédito, câmbio, preços de ativos e expectativas.','','teo',['paridade'],/\bselic\b|juros|cr[eé]dito|financiamento/i],
  ['deriv','Derivada e análise marginal','calc',3,'A derivada mede a variação instantânea. Em economia, receita marginal, custo marginal e utilidade marginal são derivadas.','RMg = dRT/dQ','mat',['cournot'],/custo marginal|margem bruta|margem operacional/i],
  ['lagrange','Otimização com Lagrange','calc',1,'Método para maximizar ou minimizar uma função sujeita a restrições, como utilidade sujeita ao orçamento.','ℒ = f(x,y) − λ·[g(x,y) − c]','mat',[],/otimiza|restri[cç][aã]o or[cç]ament/i],
  ['difeq','Equações em diferença','calc',0,'Relacionam o valor de uma variável hoje com seus valores passados. Base do modelo da teia de aranha e de séries temporais.','Pₜ = A − k·Pₜ₋₁','lab',['elast','series'],/safra|plantio|colheita|ciclo de pre[cç]os?/i],
  ['regressao','Regressão linear','est',2,'Estima a relação média entre uma variável e outras, por mínimos quadrados.','y = β₀ + β₁x + ε','mat',['capm','causal'],/econometr|correla[cç][aã]o|pesquisa mostra|levantamento/i],
  ['series','Séries temporais','est',1,'Dados ordenados no tempo. Modelos como AR e ARIMA usam o passado para prever o futuro.','yₜ = c + φ·yₜ₋₁ + εₜ','teo',[],/previs[aã]o|proje[cç][aã]o|expectativas?|forecast|boletim focus/i],
  ['causal','Causalidade e experimentos','est',0,'Separar correlação de causa: experimentos aleatorizados, diferenças em diferenças, variáveis instrumentais.','','teo',[],/experimento|evid[eê]ncia|estudo (?:mostra|aponta|indica)/i],
  ['vpl','VPL e fluxo de caixa','fin',2,'Valor presente líquido: soma dos fluxos futuros descontados menos o investimento. Projeto com VPL positivo cria valor.','VPL = Σ FCₜ/(1+r)ᵗ − I₀','mat',['valuation'],/investimentos? de|aporte|capex|bilh[oõ]es em|investir/i],
  ['capm','CAPM','fin',1,'Modelo que relaciona o retorno esperado de um ativo ao seu risco sistemático (beta).','E[rᵢ] = r_f + βᵢ·(E[r_m] − r_f)','mat',['valuation'],/a[cç][oõ]es|ibovespa|\bbolsa\b|s&p|nasdaq|\bstocks?\b|wall street/i],
  ['valuation','Valuation','fin',1,'Estimar quanto vale uma empresa: fluxo de caixa descontado, múltiplos, soma das partes.','','casos',['dupont'],/valor de mercado|valuation|\bipo\b|market cap|aquisi[cç][aã]o|takeover/i],
  ['dupont','ROE e análise DuPont','cont',2,'Decompõe o ROE em margem líquida × giro do ativo × alavancagem, para ver de onde vem a rentabilidade.','ROE = (L/V)·(V/A)·(A/PL)','casos',[],/lucro|balan[cç]o|resultado trimestral|rentabilidade|\broe\b|earnings|receita/i],
  ['pdd','Provisões para perdas (PDD)','cont',1,'Reserva que o banco faz para calotes esperados. Reduz o lucro contábil antes de a perda acontecer.','Perda esperada = PD × LGD × EAD','teo',[],/inadimpl|calote|provis[aã]o|recupera[cç][aã]o judicial|default/i],
  ['paridade','Paridade de juros','inter',1,'Diferença de juros entre dois países deveria ser compensada pela variação esperada do câmbio.','E[Sₜ₊₁]/Sₜ = (1+i)/(1+i*)','mat',['carry'],/d[oó]lar|c[aâ]mbio|treasur|moeda/i],
  ['termos','Termos de troca','inter',2,'Razão entre os preços das exportações e das importações de um país. Commodities caras melhoram os termos de troca do Brasil.','TT = Pₓ / Pₘ','teo',[],/exporta[cç]|importa[cç]|commodit|min[eé]rio|petr[oó]leo|balan[cç]a comercial/i],
  ['carry','Carry trade','inter',0,'Tomar empréstimo na moeda de juro baixo e aplicar na de juro alto. Lucra enquanto o câmbio não anula a diferença.','','mat',[],/carry|diferencial de juros|juro real/i],
  ['porter','Cinco forças de Porter','estr',2,'Rivalidade, novos entrantes, substitutos e poder de clientes e fornecedores determinam a rentabilidade de um setor.','','casos',['inovacao'],/market share|participa[cç][aã]o de mercado|rival|competi[cç][aã]o/i],
  ['inovacao','Dilema da inovação','estr',1,'Empresas líderes perdem para tecnologias novas e “piores” porque ouvem seus melhores clientes e protegem o negócio atual.','','casos',[],/intelig[eê]ncia artificial|\bia\b|startup|inova[cç]|disrup|\bai\b|openai|anthropic/i]
].map(c => ({id:c[0],name:c[1],disc:c[2],m0:c[3],m:c[3],def:c[4],f:c[5],acad:c[6],links:c[7],re:c[8]}));
const MLBL = ['Não vi','Vi em aula','Sei explicar','Sei aplicar'];

const PROBS = [
  {id:'uip',title:'Quanto o mercado “espera” para o dólar?',conc:'paridade',enun:'Suponha juro de 14% ao ano no Brasil, 3,5% nos EUA e dólar a R$ 5,40 hoje. Pela paridade descoberta de juros, qual o dólar esperado daqui a um ano?',unit:'R$',ans:5.40*1.14/1.035,tol:.02,
   steps:['Razão dos juros: 1,14 ÷ 1,035 = <b>1,1014</b>','Dólar esperado: 5,40 × 1,1014 = <b>R$ 5,95</b>','Leitura: o mercado precisaria esperar uma desvalorização de cerca de 10% do real para as duas aplicações renderem o mesmo.']},
  {id:'vpl',title:'Vale a pena investir?',conc:'vpl',enun:'Um projeto custa R$ 100 mil hoje e gera R$ 30 mil por ano durante 5 anos. Com taxa de desconto de 12% ao ano, qual o VPL (em R$ mil)?',unit:'R$ mil',ans:8.14,tol:.06,
   steps:['Fator de anuidade: [1 − 1,12⁻⁵] ÷ 0,12 = <b>3,6048</b>','Valor presente dos fluxos: 30 × 3,6048 = <b>108,14</b>','VPL = 108,14 − 100 = <b>8,14 mil</b>. Positivo: o projeto cria valor.']},
  {id:'mono',title:'Preço que maximiza o lucro',conc:'deriv',enun:'Um monopolista enfrenta demanda P = 100 − 2Q e tem custo marginal constante de 20. Qual o preço que maximiza o lucro?',unit:'R$',ans:60,tol:.5,
   steps:['Receita total: RT = 100Q − 2Q²','Receita marginal (derivada): RMg = 100 − 4Q','RMg = CMg → 100 − 4Q = 20 → <b>Q = 20</b>','Preço: P = 100 − 2·20 = <b>60</b>. Lucro = (60 − 20)·20 = 800.']},
  {id:'capm',title:'Retorno exigido de uma ação',conc:'capm',enun:'A taxa livre de risco é 10% ao ano e o prêmio de risco de mercado é 6%. Qual o retorno esperado, em %, de uma ação com beta 1,3?',unit:'%',ans:17.8,tol:.1,
   steps:['CAPM: E[r] = r_f + β·(prêmio de mercado)','E[r] = 10 + 1,3 × 6 = <b>17,8%</b>','Beta acima de 1: a ação oscila mais que o mercado, então exige retorno maior.']}
];

const THEORY = [
  {name:'Regra de Taylor',conc:'taylor',eq:'i = r* + π + 0,5·(π − π*) + 0,5·(y − y*)',int:'O banco central sobe o juro mais que a inflação quando ela passa da meta, para elevar o juro real e esfriar a economia.',hip:'Juro neutro e hiato do produto conhecidos.',lim:'Nenhum dos dois é observado diretamente; as estimativas mudam muito.'},
  {name:'Paridade descoberta de juros',conc:'paridade',eq:'E[S<sub>t+1</sub>] / S<sub>t</sub> = (1 + i) / (1 + i*)',int:'A diferença de juros entre dois países deveria ser compensada pela variação esperada do câmbio.',hip:'Investidores neutros ao risco, capital livre.',lim:'Falha com frequência na prática, e por isso o carry trade lucra na média.'},
  {name:'Modelo de Solow',conc:'solow',eq:'Δk = s·f(k) − (n + δ)·k',int:'Poupar e investir aumenta o capital por trabalhador, com retornos decrescentes. No longo prazo, só a tecnologia sustenta o crescimento per capita.',hip:'Retornos decrescentes; poupança e população dadas.',lim:'Não explica de onde vem a tecnologia.'},
  {name:'Duopólio de Cournot',conc:'cournot',eq:'q₁ = (a − c − b·q₂) / 2b',int:'Cada empresa escolhe quanto produzir considerando a produção da rival. Com mais concorrentes, o preço cai em direção ao custo marginal.',hip:'Produto homogêneo; empresas escolhem quantidade ao mesmo tempo.',lim:'Em muitos setores a disputa é por preço (Bertrand), não por quantidade.'},
  {name:'CAPM',conc:'capm',eq:'E[r<sub>i</sub>] = r<sub>f</sub> + β<sub>i</sub>·(E[r<sub>m</sub>] − r<sub>f</sub>)',int:'Só o risco que não dá para diversificar (beta) deve ser remunerado.',hip:'Investidores diversificados e mercados eficientes.',lim:'Betas instáveis; fatores como tamanho e valor explicam retornos que o CAPM não explica.'},
  {name:'Teia de aranha',conc:'difeq',eq:'P<sub>t</sub> = A − k·P<sub>t−1</sub>',int:'Produtores plantam olhando o preço da safra anterior. O preço oscila em torno do equilíbrio e só converge se a oferta reagir menos que a demanda (k &lt; 1).',hip:'Expectativas ingênuas: o produtor espera que o preço de amanhã seja igual ao de hoje.',lim:'Produtores reais usam mercados futuros e aprendem com o tempo.'}
];

const CASES = [
  {id:'kodak',name:'Kodak e a câmera digital',per:'1975 – 2012',res:'Um engenheiro da Kodak, Steve Sasson, construiu um dos primeiros protótipos de câmera digital em 1975. A empresa, que lucrava com filme e revelação, tratou a tecnologia com cautela para não canibalizar o negócio principal. Quando a fotografia digital se popularizou, a Kodak ficou para trás e pediu recuperação judicial em 2012.',fw:'Dilema da inovação (Clayton Christensen)',q:'Se você fosse CEO em 1990, como financiaria o digital sem destruir o caixa do filme?',conc:['inovacao','vpl']},
  {id:'netflix',name:'Netflix: canibalizar o próprio negócio',per:'2007 – 2013',res:'A Netflix alugava DVDs pelo correio quando lançou o streaming, em 2007. Em vez de proteger o negócio antigo, migrou os clientes para o digital e, a partir de 2013, passou a produzir séries próprias para depender menos dos estúdios.',fw:'Cinco forças: poder de barganha dos fornecedores',q:'Por que produzir conteúdo próprio reduz o poder de barganha dos estúdios?',conc:['porter','inovacao']},
  {id:'nubank',name:'Nubank: crescer com custo baixo',per:'2013 – 2021',res:'Fundado em 2013 com um cartão sem anuidade gerenciado pelo aplicativo, o Nubank cresceu muito por indicação de clientes, com custo de aquisição baixo. Abriu capital na Bolsa de Nova York em 2021.',fw:'Economia unitária: custo de aquisição (CAC) × valor do cliente (LTV)',q:'Que métricas mostram se crescer rápido está criando ou destruindo valor?',conc:['vpl','dupont','pdd']},
  {id:'ambev',name:'Ambev e o modelo 3G',per:'1999 – 2019',res:'A fusão de Brahma e Antarctica criou a Ambev em 1999. O grupo levou o corte de custos e a meritocracia a aquisições cada vez maiores, até a compra da Anheuser-Busch em 2008. O modelo mostrou limites na Kraft Heinz, que em 2019 reconheceu uma baixa contábil bilionária no valor de suas marcas.',fw:'Eficiência operacional × investimento em marcas',q:'Cortar custos aumenta o lucro hoje. Quando isso destrói valor amanhã?',conc:['dupont','valuation']},
  {id:'nvidia',name:'Nvidia e a aposta na CUDA',per:'2006 – 2023',res:'Em 2006 a Nvidia lançou a CUDA, que permitia usar placas de vídeo para cálculos gerais. Por anos o retorno foi pequeno. Em 2012, uma rede neural treinada em GPUs da Nvidia (AlexNet) venceu uma competição de visão computacional, e a plataforma virou o padrão da IA.',fw:'Plataformas e efeitos de rede',q:'Como avaliar um investimento cujo retorno é incerto e distante?',conc:['vpl','inovacao','porter']}
];

const FLASH = [
  ['O que diz a regra de Taylor?','O juro deve subir quando a inflação passa da meta e quando a economia opera acima do potencial.'],
  ['Por que uma curva de juros invertida preocupa?','Juros longos abaixo dos curtos indicam que o mercado espera cortes futuros, em geral por desaceleração.'],
  ['O que é a análise DuPont?','Decompõe o ROE em margem líquida × giro do ativo × alavancagem.'],
  ['O que significa beta = 1,3?','A ação tende a subir ou cair 1,3% para cada 1% do mercado. Tem mais risco sistemático que a média.'],
  ['Qual a regra de decisão do VPL?','Aceitar projetos com VPL positivo: eles rendem mais que o custo de capital.'],
  ['Quando a teia de aranha converge?','Quando k = b·d &lt; 1, ou seja, a oferta reage menos ao preço que a demanda.']
];

const TRILHAS = [
  ['Research de ações','Analisar empresas e recomendar compra ou venda.',['Contabilidade','Valuation','Excel','Escrita'],['dupont','valuation','vpl']],
  ['Finanças quantitativas','Modelos matemáticos para preço, risco e estratégias.',['Cálculo','Estatística','Python','Séries temporais'],['series','regressao','capm']],
  ['Macro e política econômica','Cenários de juros, câmbio e inflação para bancos e governo.',['Macro','Econometria','Leitura de dados oficiais'],['taylor','transm','paridade']],
  ['Estratégia e consultoria','Resolver problemas de negócio para empresas.',['Estratégia','Modelagem','Apresentação'],['porter','inovacao','vpl']]
];
const CERT = [['CPA-20','ANBIMA','Para atender investidores no mercado financeiro'],['CEA','ANBIMA','Especialista em investimentos, consultoria a clientes'],['CFA','CFA Institute','Análise de investimentos, reconhecida no mundo todo (3 níveis)']];

/* Temas acompanhados na tela de tendências */
const THEMES = [
  ['Juros e Copom',/copom|\bselic\b|juros|\bfed\b|rate cut/i],
  ['Inflação',/infla[cç]|\bipca\b|\bcpi\b/i],
  ['Fiscal e dívida pública',/fiscal|d[ií]vida p[uú]blica|arcabou[cç]o|or[cç]amento|deficit|d[eé]ficit/i],
  ['IA e agentes',/intelig[eê]ncia artificial|\bia\b|\bai\b|agentes? de|openai|anthropic|\bllm/i],
  ['Bitcoin e cripto',/bitcoin|cripto|crypto|stablecoin|ethereum/i],
  ['Safra e grãos',/safra|soja|milho|gr[aã]os|colheita/i],
  ['Petróleo e energia',/petr[oó]leo|brent|opep|opec|energia/i],
  ['Tarifas e comércio',/tarif|guerra comercial|trade war|exporta[cç]/i],
  ['China',/china|chin[eê]s|chinesa/i],
  ['Mercado de trabalho',/desemprego|emprego|vagas|payroll|jobs/i],
  ['Bancos e crédito',/\bbancos?\b|cr[eé]dito|inadimpl/i],
  ['Eleições',/elei[cç]|candidat|pesquisa eleitoral/i]
];
