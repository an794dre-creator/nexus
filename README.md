# NEXUS

Radar pessoal de economia, mercados, empresas, IA, cripto e agro, ligado aos estudos.
Um aplicativo web instalável (PWA) que abre no celular e no PC com ícone próprio.

## Como funciona

```
GitHub Actions (a cada hora)
  └─ collector/collect.py  ──►  web/data/latest.json      (notícias 72 h, indicadores, Focus, papers)
                             └►  web/data/archive/AAAA-MM.json  (histórico de manchetes → tendências)
GitHub Pages
  └─ publica a pasta web/  ──►  https://SEU-USUARIO.github.io/nexus/
```

- **Coletor** em Python, só com a biblioteca padrão (nada para instalar).
- **App** em HTML, CSS e JavaScript puros, sem etapa de build.
- **Custo:** zero. A IA (análises e chat) entra na versão 2, com a API do Claude.

### Fontes

| Tipo | Fonte |
|---|---|
| Indicadores do Brasil | Banco Central (SGS): Selic, IPCA 12m, IGP-M 12m, desemprego, dólar e euro PTAX |
| Expectativas | Boletim Focus (API Olinda do BCB) |
| Bolsas, juros dos EUA, moedas, commodities | Yahoo Finance (endpoint público não oficial, pode falhar) |
| Cripto | CoinGecko |
| Notícias | Agência Brasil, G1, Valor, Folha, InfoMoney, Exame, Poder360, Fed, BCE, BBC, CNBC, NYT, TechCrunch, MIT Tech Review, Hacker News, CoinDesk, Cointelegraph, Livecoins, Canal Rural, Globo Rural |
| Papers | arXiv (q-fin, econ) e NBER |

Para adicionar ou trocar fontes, edite `collector/config.py`.
Para trocar as disciplinas e conceitos do "Meu cérebro", edite `web/content.js`.

## Rodar no seu computador

```bash
py collector/collect.py
```

```bash
py -m http.server 8765 -d web
```

Depois abra http://localhost:8765

## Publicar (uma vez só)

1. **Instale o Git**: `winget install Git.Git` (ou baixe em git-scm.com).
2. **Crie uma conta no GitHub** e um repositório **público** chamado `nexus`, sem README.
   O GitHub Pages gratuito exige repositório público. Só notícias públicas ficam lá;
   suas notas e seu domínio dos conceitos ficam salvos apenas no seu aparelho.
3. **Envie o código** (na pasta do projeto):
   ```bash
   git init -b main
   git add .
   git commit -m "NEXUS v1"
   git remote add origin https://github.com/SEU-USUARIO/nexus.git
   git push -u origin main
   ```
4. No repositório: **Settings → Pages → Source: GitHub Actions**.
5. **Actions → Coletar e publicar → Run workflow** (a primeira coleta).
   Depois disso ele roda sozinho a cada hora.
6. Abra `https://SEU-USUARIO.github.io/nexus/`:
   - **Android (Chrome):** menu ⋮ → *Instalar app*.
   - **iPhone (Safari):** compartilhar → *Adicionar à Tela de Início*.
   - **PC (Chrome/Edge):** ícone de instalar na barra de endereço.

## Estrutura

```
collector/   config.py (fontes e regras) · collect.py (coleta)
web/         index.html · styles.css · app.js · content.js · sw.js · manifest · icons/ · data/
tools/       make_icons.py (gera os ícones)
.github/workflows/coletar.yml   agendamento + publicação
```

## Próximas versões

- **v2 · IA:** análise de cada destaque em 7 blocos (fato, contexto, mecanismo, consequências,
  conexões, o que acompanhar, o que estudar) e o chat "Pergunte ao NEXUS", com a API do Claude.
- **v3 · Segundo cérebro completo:** subir ementas e slides, notas sincronizadas entre aparelhos,
  busca no histórico inteiro.
