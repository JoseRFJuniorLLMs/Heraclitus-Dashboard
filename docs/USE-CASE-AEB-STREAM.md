# Caso de uso AEB-STREAM no Heraclitus Dashboard

Snapshot fonte incorporado: `JoseRFJuniorLLMs/AEB@b8e9de466e9071a4b1c490a4faabb249dda36e9b`.

## Objetivo

Representar o AEB-STREAM como aplicação vertical de operação espacial e perícia temporal construída sobre HeraclitusDB, sem duplicar o repositório AEB nem fingir que capacidades de roadmap já existem no runtime.

## Arquitetura observada

```text
CelesTrak / Space-Track / INPE
          │
          ▼
     pipeline.py
      Os Sentidos
  TLE → SGP4 → H×S×E
          │ append gRPC
          ▼
   HeraclitusDB AEB
 append-only · LSN · parents
 AS OF · PROVENANCE · WHY
          │ scan/query
          ▼
      main.py
      O Cérebro
 SatGraph + detectores + ACT-R
          │ Anomalia(parent=OrbitState)
          ▼
 dashboard.py / consulta.py
```

O projeto usa uma instância dedicada do HeraclitusDB por padrão em `127.0.0.1:7476` e o dashboard AEB em `127.0.0.1:7480`.

## Fronteira de dados

A integração diferencia explicitamente:

- **órbita/TLE:** fonte real CelesTrak, com cache local e fallback offline;
- **propagação orbital:** SGP4 + conversão TEME/ECEF/WGS84;
- **telemetria térmica/elétrica atual:** simulada pelo PoC em `pipeline.simular_telemetria()`;
- **telemetria operacional real:** roadmap, a ser substituída por feed de estação terrena/INPE;
- **Space-Track e feeds INPE/CDSR/CRC:** roadmap, não marcados como runtime ativo.

Isso evita transformar uma simulação arquitetural em alegação operacional sobre satélites reais.

## Geometria H × S × E

A superfície AEB expõe o mapeamento usado pelo projeto:

- `S`: posição orbital na esfera unitária;
- `E`: altitude, excentricidade, movimento médio e métricas contínuas;
- `H`: hierarquia de hardware na bola de Poincaré.

Os vetores `sph`, `euc` e `hyp` são enviados no append do `OrbitState`.

## Cérebro e anomalias

O snapshot possui:

- `agent/graph.py`: grafo temporal de satélites/estados;
- `agent/act_r.py`: ativação/priorização ACT-R;
- `agent/anomalias.py`: detectores puros;
- `main.py`: daemon/checkpoint e emissão de `Anomalia`.

Regras declaradas no snapshot:

- `TERMICA`: bateria fora de `-20..45 °C`, crítica;
- `TERMICA_SALTO`: delta > `40 °C`, alta;
- `ENERGIA`: tensão < `30 V` fora de eclipse, crítica;
- `ORBITA`: desvio > `30 km` da média, média.

Uma `Anomalia` é gravada como novo evento e referencia o `OrbitState` de origem como parent, preservando a cadeia de proveniência.

## Runtime vivo incorporado

O Dashboard geral expõe apenas:

```text
GET /aeb-api/data
```

que faz proxy para:

```text
AEB dashboard.py -> GET /api/data
```

O payload contém `satelites`, `estados`, `anomalias` e `head`. O componente AEB deriva apenas métricas de apresentação, como o número atual de contactos visíveis com as quatro estações modeladas pelo dashboard original.

Nenhum `POST`, asset remoto arbitrário ou rota de escrita do AEB é proxied.

Configuração:

```dotenv
AEB_HOST=127.0.0.1
AEB_PORT=7480
```

Arranque no checkout AEB:

```bash
python3 dashboard.py
```

Para uma demonstração completa do caso:

```bash
python3 pipeline.py --grupo --once
python3 main.py --daemon --interval 8
python3 stream.py --accel 60 --interval 3
python3 dashboard.py
```

## Segurança

- proxy AEB é same-host configurável e allow-listed por rota;
- credenciais Core/Agent não são encaminhadas ao AEB;
- a UI geral permanece read-only;
- CSS do caso é isolado sob `.aeb-case`;
- nenhum iframe externo é usado;
- o snapshot fonte é pinado para rastreabilidade.

## Arquivos representados

### Entrypoints

- `pipeline.py`
- `consulta.py`
- `main.py`
- `stream.py`
- `seed_demo.py`
- `dashboard.py`
- `requirements.txt`

### Motor

- `agent/orbit.py`
- `agent/graph.py`
- `agent/act_r.py`
- `agent/anomalias.py`

### Dashboard original

- `assets/dasboard.png`
- `assets/earth.jpg`
- `assets/topo.png`
- `assets/sky.png`
- `assets/globe.gl.min.js`

O repositório `JoseRFJuniorLLMs/AEB` continua sendo a fonte canônica do caso de uso.