# Heraclitus SOC — dez telas com APIs reais

Entrada: `index.html`, `css/soc.css` e `js/soc.js`. Servidor: `server.py`.

O workbench temporal simulado foi removido a pedido do proprietário. Seus
arquivos permanecem recuperáveis no histórico Git. Componentes legados
anteriores não são carregados pela página principal.

## Telas mantidas

1. Visão operacional
2. Postura SOC
3. Eventos de segurança
4. Incidentes Sentinel
5. Ações e aprovações (consulta)
6. Saúde dos sensores
7. Fontes de dados
8. Casos e investigação
9. Integridade e conformidade
10. Estado do banco

Filtros locais e de API, AS OF LSN onde suportado, detalhes, evidências,
exportação JSON e integridade sob demanda. Sem números simulados.
O Sentinel opera em observe; nenhuma ação externa automática é executada.

## Operação na WSL

Abra http://127.0.0.1:9337/. Use a credencial configurada na instância.
Não existe senha padrão neste repositório. O banco e seus dados não são
substituídos pelo deploy do dashboard.

```bash
python3 server.py
systemctl status heraclitus-soc heraclitus-dev
```

Deploy: `/home/junior/heraclitus-soc`. Serviços habilitados no systemd da WSL.
Isso não configura inicialização do Windows. Acesso restrito a loopback;
RC e credencial de desenvolvimento não equivalem a qualificação de produção.

## Segurança

Proxy somente leitura, upstream fixo, Host validado, arquivos privados
bloqueados, CSP sem scripts inline e sem conexões externas. Credenciais
somente em memória da página; nenhuma persistência em storage do navegador.
Python HTTP server é destinado à operação local, não exposição pública.
Não há ingestão automática nem coletores configurados; dados anteriores
permanecem preservados, sem migração por este deploy.

## Testes

```bash
node --check js/soc.js
node tests/render.cjs
python3 tests/test_server.py
# tests/smoke.py recebe a credencial pelo stdin e testa o serviço implantado.
```
