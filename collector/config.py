"""Configuração do coletor NEXUS: fontes, séries e regras de classificação."""

# ---------------------------------------------------------------------------
# Feeds RSS / Atom
# kind: "prim" = fonte primária (órgão oficial, empresa, paper); "imp" = imprensa
# area: assunto padrão do feed (as regras de palavra-chave podem mudar)
# ---------------------------------------------------------------------------
FEEDS = [
    # Brasil
    {"name": "Agência Brasil · Economia", "url": "https://agenciabrasil.ebc.com.br/rss/economia/feed.xml", "kind": "prim", "area": "macro"},
    {"name": "G1 Economia", "url": "https://g1.globo.com/dynamo/economia/rss2.xml", "kind": "imp", "area": "macro"},
    {"name": "Valor Econômico", "url": "https://valor.globo.com/rss/valor", "kind": "imp", "area": "empresas"},
    {"name": "Folha Mercado", "url": "https://feeds.folha.uol.com.br/mercado/rss091.xml", "kind": "imp", "area": "macro"},
    {"name": "InfoMoney", "url": "https://www.infomoney.com.br/feed/", "kind": "imp", "area": "mercados"},
    {"name": "Exame", "url": "https://exame.com/feed/", "kind": "imp", "area": "empresas"},
    {"name": "Poder360", "url": "https://www.poder360.com.br/feed/", "kind": "imp", "area": "politica"},
    # Bancos centrais e organismos
    {"name": "Federal Reserve", "url": "https://www.federalreserve.gov/feeds/press_all.xml", "kind": "prim", "area": "global"},
    {"name": "Banco Central Europeu", "url": "https://www.ecb.europa.eu/rss/press.html", "kind": "prim", "area": "global"},
    # Economia global
    {"name": "BBC Business", "url": "https://feeds.bbci.co.uk/news/business/rss.xml", "kind": "imp", "area": "global"},
    {"name": "CNBC Economy", "url": "https://www.cnbc.com/id/20910258/device/rss/rss.html", "kind": "imp", "area": "global"},
    {"name": "NYT Business", "url": "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml", "kind": "imp", "area": "empresas"},
    # IA e tecnologia
    {"name": "TechCrunch IA", "url": "https://techcrunch.com/category/artificial-intelligence/feed/", "kind": "imp", "area": "ia"},
    {"name": "MIT Technology Review", "url": "https://www.technologyreview.com/feed/", "kind": "imp", "area": "ia"},
    {"name": "Hacker News", "url": "https://hnrss.org/frontpage?points=200", "kind": "imp", "area": "ia"},
    # Cripto
    {"name": "CoinDesk", "url": "https://www.coindesk.com/arc/outboundfeeds/rss/", "kind": "imp", "area": "cripto"},
    {"name": "Cointelegraph", "url": "https://cointelegraph.com/rss", "kind": "imp", "area": "cripto"},
    {"name": "Livecoins", "url": "https://www.livecoins.com.br/feed/", "kind": "imp", "area": "cripto"},
    # Agro
    {"name": "Canal Rural", "url": "https://www.canalrural.com.br/feed/", "kind": "imp", "area": "agro"},
    {"name": "Globo Rural", "url": "https://globorural.globo.com/rss/globorural/", "kind": "imp", "area": "agro"},
    # Carreira: sem feed dedicado estável; os itens entram pela regra de palavras-chave
]

# Papers: arXiv (finanças quantitativas e economia) e NBER (working papers novos)
ARXIV_QUERY = "cat:q-fin.* OR cat:econ.*"
ARXIV_MAX = 25
NBER_FEED = "https://www.nber.org/rss/new.xml"

# ---------------------------------------------------------------------------
# Séries do Banco Central (SGS)  https://api.bcb.gov.br
# ---------------------------------------------------------------------------
BCB_SERIES = [
    # days = janela consultada (a API aceita no máximo 10 anos por consulta)
    {"id": "selic", "code": 432, "name": "Selic meta", "unit": "%", "days": 800, "delta": "pp", "group": "brasil", "src": "BCB · SGS 432"},
    {"id": "ipca12", "code": 13522, "name": "IPCA 12 meses", "unit": "%", "days": 1000, "delta": "pp", "group": "brasil", "src": "BCB · SGS 13522"},
    {"id": "desemprego", "code": 24369, "name": "Desemprego (PNAD)", "unit": "%", "days": 1000, "delta": "pp", "group": "brasil", "src": "BCB · SGS 24369"},
    {"id": "usdbrl", "code": 1, "name": "Dólar (USD/BRL)", "unit": "R$", "days": 100, "delta": "pct", "group": "cambio", "src": "BCB · PTAX"},
    {"id": "eurbrl", "code": 21619, "name": "Euro (EUR/BRL)", "unit": "R$", "days": 100, "delta": "pct", "group": "cambio", "src": "BCB · PTAX"},
]
IGPM_CODE = 189  # IGP-M mensal (%), o 12 meses é calculado

# Expectativas do Boletim Focus (API Olinda do BCB)
FOCUS_INDICATORS = ["IPCA", "Selic", "PIB Total", "Câmbio"]

# ---------------------------------------------------------------------------
# Cotações (Yahoo Finance, endpoint público não oficial: pode falhar)
# ---------------------------------------------------------------------------
YAHOO = [
    {"id": "ibov", "sym": "^BVSP", "name": "Ibovespa", "group": "bolsas", "fmt": "int"},
    {"id": "spx", "sym": "^GSPC", "name": "S&P 500", "group": "bolsas", "fmt": "int"},
    {"id": "ndx", "sym": "^NDX", "name": "Nasdaq 100", "group": "bolsas", "fmt": "int"},
    {"id": "sx5e", "sym": "^STOXX50E", "name": "Euro Stoxx 50", "group": "bolsas", "fmt": "int"},
    {"id": "n225", "sym": "^N225", "name": "Nikkei 225", "group": "bolsas", "fmt": "int"},
    {"id": "shcomp", "sym": "000001.SS", "name": "Xangai", "group": "bolsas", "fmt": "int"},
    {"id": "dxy", "sym": "DX-Y.NYB", "name": "Índice dólar (DXY)", "group": "cambio", "fmt": "1"},
    {"id": "eurusd", "sym": "EURUSD=X", "name": "EUR/USD", "group": "cambio", "fmt": "4"},
    {"id": "usdjpy", "sym": "JPY=X", "name": "USD/JPY", "group": "cambio", "fmt": "2"},
    {"id": "ust13w", "sym": "^IRX", "name": "Treasury 3 meses", "group": "juros", "fmt": "pct", "delta": "pp"},
    {"id": "ust5", "sym": "^FVX", "name": "Treasury 5 anos", "group": "juros", "fmt": "pct", "delta": "pp"},
    {"id": "ust10", "sym": "^TNX", "name": "Treasury 10 anos", "group": "juros", "fmt": "pct", "delta": "pp"},
    {"id": "ust30", "sym": "^TYX", "name": "Treasury 30 anos", "group": "juros", "fmt": "pct", "delta": "pp"},
    {"id": "brent", "sym": "BZ=F", "name": "Petróleo Brent", "group": "commod", "fmt": "2", "prefix": "US$ "},
    {"id": "gold", "sym": "GC=F", "name": "Ouro", "group": "commod", "fmt": "int", "prefix": "US$ ", "suffix": "/oz"},
    {"id": "soy", "sym": "ZS=F", "name": "Soja (CBOT)", "group": "commod", "fmt": "cents_bu"},
    {"id": "corn", "sym": "ZC=F", "name": "Milho (CBOT)", "group": "commod", "fmt": "cents_bu"},
    {"id": "coffee", "sym": "KC=F", "name": "Café arábica", "group": "commod", "fmt": "cents_lb"},
    {"id": "cattle", "sym": "LE=F", "name": "Boi gordo (CME)", "group": "commod", "fmt": "cents_lb"},
]

# Cripto (CoinGecko, sem chave)
COINS = [
    {"id": "btc", "cg": "bitcoin", "name": "Bitcoin"},
    {"id": "eth", "cg": "ethereum", "name": "Ether"},
    {"id": "sol", "cg": "solana", "name": "Solana"},
]

# ---------------------------------------------------------------------------
# Classificação por palavra-chave (título + resumo, minúsculas).
# A primeira regra que casar define a área; se nenhuma casar, vale a do feed.
# ---------------------------------------------------------------------------
AREA_RULES = [
    ("cripto", r"\b(bitcoin|btc|ethereum|ether|cripto|crypto|stablecoin|blockchain|solana|etf de bitcoin)\b"),
    ("agro", r"\b(soja|milho|safra|agro|agroneg[oó]cio|boi gordo|pecu[aá]ria|caf[eé] ar[aá]bica|conab|fertilizante|colheita|plantio)\b"),
    ("carreira", r"\b(vagas?|est[aá]gio|trainee|carreira|contrata[cç][aã]o|recrutamento|curr[ií]culo|jobs report|hiring)\b"),
    ("ia", r"\b(intelig[eê]ncia artificial|\bia\b|ai|openai|anthropic|nvidia|chatgpt|gemini|llm|machine learning|data center)\b"),
    ("macro", r"\b(copom|selic|ipca|igp-?m|infla[cç][aã]o|pib|d[oó]lar|c[aâ]mbio|juros|fiscal|tesouro nacional|banco central|focus|desemprego)\b"),
    ("global", r"\b(trump|fed|federal reserve|wall street|china|eua|estados unidos|europa|bce|ecb|tariffs?|tarifas?|ir[aã]|r[uú]ssia|ucr[aâ]nia|opep|opec)\b"),
    ("politica", r"\b(congresso|senado|c[aâ]mara dos deputados|lula|stf|elei[cç][aã]o|ministro|planalto|reforma)\b"),
]

# Palavras que aumentam a relevância (+1 cada, até +3)
BOOST = r"(copom|selic|fed\b|federal reserve|juros|infla[cç][aã]o|ipca|pib|gdp|resultado trimestral|lucro|balan[cç]o|tarifa|fiscal|arcabou[cç]o|d[oó]lar|bitcoin|safra|recorde|earnings|rate cut|rate hike)"

# Janela de itens mantidos em latest.json (horas)
WINDOW_HOURS = 72
MAX_ITEMS = 400
MAX_PER_FEED = 40
