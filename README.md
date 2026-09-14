# HeraclitusDB Dashboard

Interface operacional da **plataforma HeraclitusDB**. O dashboard não é o produto principal, não é apenas um SOC e não é apenas o Agent Black Box. Ele organiza as capacidades do motor em superfícies coerentes e mantém a proveniência explícita.

## Superfícies

1. **Visão geral** — saúde do motor, head LSN, índices, grafo, integridade e módulos.
2. **Dados públicos** — consulta read-only a fontes oficiais brasileiras, inicialmente Portal da Transparência e PNCP. Respostas externas são marcadas como **não seladas**.
3. **Fontes & ingestão** — origens já presentes no log HeraclitusDB e silêncio de fontes.
4. **Mapa de dados** — atributos indexados e cardinalidades reportadas pelo servidor.
5. **Linha do tempo / A-B / Casos** — recortes temporais, comparação e investigação sobre registros reais.
6. **Grafo / Reconstituição / WHY** — relações e evidências devolvidas pelo backend. A UI não inventa causalidade.
7. **Cadeia de custódia / Merkle / Compliance** — verificação e estado técnico obtidos do servidor.
8. **Agent Black Box** — módulo opcional de evidência e controle de agentes de IA: runs, tool calls, gateway, políticas e integridade.
9. **Sentinel / SOC** — segurança como módulo da plataforma, não como identidade inteira do HeraclitusDB.
10. **Governança** — painel executivo, auditoria e atendimento ao titular.

## Regra de proveniência

```text
fonte oficial externa
        ↓ observação
resposta do Portal / PNCP
        ↓ ingestão explícita
HeraclitusDB canonical log
        ↓
LSN + proveniência + integridade verificável
        ↓
views / grafo / texto / vetores / análises
```

Uma resposta consultada no Portal da Transparência **não recebe automaticamente** LSN, Merkle proof ou status `VERIFIED`. Só passa a ser evidência Heraclitus após ingestão no log canônico.

## Arranque local

```bash
cp .env.example .env
# edite as variáveis necessárias e exporte-as para o processo
python3 server.py
```

Abra `http://127.0.0.1:9337/`.

O host local expõe três superfícies read-only:

```text
/api/*          -> HeraclitusDB REST, padrão 127.0.0.1:7475
/agent-api/*    -> Agent Evidence API, padrão 127.0.0.1:8080
/public-api/*   -> fontes governamentais allow-listed
```

O dashboard não aceita mutações HTTP. Aprovação de agentes, ativação de policy, comandos de casos e outras escritas continuam fora desta UI até existir um fluxo de autorização específico.

## Portal da Transparência

Configure a chave somente no servidor:

```bash
export PORTAL_TRANSPARENCIA_API_KEY='...'
python3 server.py
```

A chave é enviada pelo proxy no cabeçalho oficial `chave-api-dados` e nunca precisa chegar ao JavaScript do navegador.

Datasets inicialmente allow-listed incluem contratos, licitações, sanções, emendas, servidores, viagens, documentos de despesa, notas fiscais, pessoas jurídicas e cartões.

O PNCP possui uma allowlist separada. Não existe proxy de URL arbitrária.

## Autenticação

Credenciais do HeraclitusDB ficam **somente na memória da página**. Recarregar o navegador apaga a credencial. O papel RBAC não é escolhido no browser: é definido/validado pelo servidor HeraclitusDB.

## O que foi removido

A aplicação anterior tinha superfícies demonstrativas capazes de parecer reais: incidente fixo, grafo de ataque fixo, causa raiz fixa, resposta de “IA forense”, painel de compliance todo verde e timeline com 800 eventos sintéticos. Essas afirmações foram removidas. Estado desconhecido aparece como desconhecido.

Também foram retiradas as fontes concorrentes da aplicação (`main.py`, `index2.html`, `js/soc.js`): o runtime canônico é `index.html` + `js/app.js` + `js/components/*`.

## Segurança do host local

- bind somente em loopback;
- validação estrita de `Host` contra DNS rebinding;
- allowlists independentes para Core, Agent e dados públicos;
- sem proxy arbitrário/SSRF;
- limite de resposta de 8 MiB;
- CSP same-origin para scripts e conexões;
- arquivos do repositório, `.env`, Python e testes não são servidos;
- operações `POST` são recusadas.

## Testes

```bash
find js -name '*.js' -print0 | xargs -0 -n1 node --check
node tests/contracts.cjs
python3 -m py_compile server.py
python3 -m unittest -v tests.test_server
```

O GitHub Actions executa os mesmos gates.

## Auditoria

A auditoria recursiva de cinco passagens que originou esta reorganização está em:

`docs/AUDITORIA-RECURSIVA-5X-2026-09-14.md`
