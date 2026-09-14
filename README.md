# HeraclitusDB Dashboard

Interface operacional da **plataforma HeraclitusDB**. O dashboard não é o produto principal, não é apenas um SOC e não é apenas o Agent Black Box. Ele organiza o motor e seus módulos em superfícies coerentes, com proveniência e estado operacional explícitos.

## Superfícies

1. **Visão geral** — head LSN, memtable, texto, vetores, grafo, entidades, ACT-R, integridade e módulos.
2. **Capacidades & runtime** — catálogo do que pertence ao HeraclitusDB e do que esta instância consegue realmente observar. Distingue `observado`, `disponível`, `não suportado`, `indisponível`, `sem autorização` e `não sondado`.
3. **Dados públicos** — Portal da Transparência e PNCP via proxy allow-listed. Cada resposta pode virar uma observação `EXTERNAL_UNSEALED` com origem, filtros, horário e SHA-256, mas **sem fingir que já recebeu LSN/Merkle**.
4. **Fontes & ingestão / Mapa de dados** — origens já presentes no log e atributos reportados pelo Core.
5. **Linha do tempo / A-B / Casos** — recortes temporais e investigação sobre registros reais.
6. **Grafo / Reconstituição / WHY** — relações e evidências devolvidas pelo backend. A UI não inventa causalidade.
7. **Cadeia de custódia / Merkle / Compliance** — verificação e estado técnico obtidos do servidor.
8. **Agent Black Box** — módulo opcional de evidência e controle de agentes: runs, tool calls, gateway, policy, approvals, ingest counters e integridade.
9. **Sentinel / SOC** — segurança como módulo da plataforma, não como identidade inteira do HeraclitusDB.
10. **Governança** — painel executivo, auditoria e atendimento ao titular.

## Regra de proveniência

```text
fonte oficial externa
        ↓ observação
EXTERNAL_UNSEALED + source/query/time/SHA-256
        ↓ ingestão explícita futura
HeraclitusDB canonical log
        ↓
LSN + proveniência + integridade verificável
        ↓
views / grafo / texto / vetores / análises
```

Uma resposta consultada no Portal da Transparência ou PNCP **não recebe automaticamente** LSN, Merkle proof ou status `VERIFIED`.

## Arranque local

```bash
cp .env.example .env
# exporte as variáveis necessárias para o processo
python3 server.py
```

Por padrão: `http://127.0.0.1:9337/`.

Configuração do host local:

```bash
export HERACLITUS_DASHBOARD_BIND=127.0.0.1
export HERACLITUS_DASHBOARD_PORT=9337
export HERACLITUS_DASHBOARD_ALLOWED_HOSTS='localhost:9337,127.0.0.1:9337,[::1]:9337'
```

O host expõe três superfícies read-only:

```text
/api/*          -> HeraclitusDB Core REST, padrão 127.0.0.1:7475
/agent-api/*    -> Agent Evidence API, padrão 127.0.0.1:8080
/public-api/*   -> fontes governamentais allow-listed
```

`/api/live/events` possui proxy SSE streaming próprio. O dashboard não aceita mutações HTTP.

## Autenticação

Core e Agent são domínios separados:

- **Core:** Basic/Bearer conforme o servidor, guardado somente na memória da página.
- **Agent:** token Bearer/OIDC opcional separado, também apenas em memória.
- **Nunca** reutilizamos automaticamente o Basic do Core no Agent.
- Recarregar a página apaga ambas as credenciais.
- RBAC/papel vem do backend, não de uma escolha do navegador.

## Portal da Transparência

Configure a chave somente no processo Python:

```bash
export PORTAL_TRANSPARENCIA_API_KEY='...'
python3 server.py
```

A chave segue no header oficial `chave-api-dados` e não chega ao JavaScript. Datasets allow-listed incluem contratos, licitações, sanções, emendas, servidores, viagens, documentos de despesa, notas fiscais, pessoas jurídicas e cartões.

O Portal publica conjuntos com periodicidades diferentes. O dashboard deliberadamente **não chama tudo de tempo real**.

## PNCP

O dashboard usa apenas endpoints públicos allow-listed. O status local diferencia “proxy habilitado” de “upstream testado”: uma configuração existente não é prova de disponibilidade da fonte externa.

## Agent Black Box

A superfície lê a API real do módulo Agent e exibe:

```text
runs / tool calls / denied / approvals pendentes
MCP gateway / bypass protection / capture mode
policy ativa / lifecycle / regras
accepted events / duplicates / conflicts / rejected
ALLOW / DENY / REQUIRE_APPROVAL / shadow deny / upstream errors
run detail / LSN range / broken parents / timeline
```

O dashboard geral continua **somente leitura**. Aprovar ações ou ativar policy não é liberado aqui apenas porque existe um botão bonito a ser desenhado.

## Segurança do host local

- bind em loopback por padrão;
- allowlist de `Host` configurável para proteção contra DNS rebinding;
- allowlists independentes para Core, Agent e dados públicos;
- sem proxy arbitrário/SSRF;
- limite de resposta de 8 MiB para respostas não-streaming;
- CSP same-origin;
- arquivos do repositório, `.env`, Python e testes não são servidos;
- operações `POST` são recusadas;
- credenciais não são persistidas em localStorage/sessionStorage.

## Testes

```bash
find js -name '*.js' -print0 | xargs -0 -n1 node --check
node tests/contracts.cjs
python3 -m py_compile server.py
python3 -m unittest -v tests.test_server
```

O GitHub Actions executa os mesmos gates.

## Auditorias

- `docs/AUDITORIA-RECURSIVA-5X-2026-09-14.md` — reorganização inicial platform-first.
- `docs/AUDITORIA-RECURSIVA-5X-ROUND2-2026-09-14.md` — segunda auditoria, cobrindo capabilities, dados públicos/proveniência, Agent OIDC, SSE e comparação com projetos maduros.

## Próximos trabalhos que exigem backend real

O dashboard não deve maquiar como concluído o que ainda pertence ao Core/pipeline:

- ingestão Portal/PNCP → HRKL com cursor, idempotência e checkpoints;
- normalizadores governamentais versionados;
- entity resolution reversível;
- grafo real órgão → contratação → contrato → fornecedor → vínculos → sanções → pagamentos;
- provenance drill-down até fonte externa;
- endpoint Core oficial `/capabilities`;
- filtros/field picker avançados;
- E2E com HeraclitusDB real e fixtures oficiais congeladas;
- captura nativa de ferramentas internas Claude Code/Codex além de MCP/OTLP.
