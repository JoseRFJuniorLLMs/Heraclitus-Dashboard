# SPEC-FRD-001 v2.0  
## Detecção, Triangulação e Evidência de Riscos de Integridade Pública no HeraclitusDB

**Status:** Proposed  
**Prioridade:** P0/P1  
**Domínio:** Integridade Pública, Auditoria, Compliance, Detecção de Anomalias  
**Plataforma:** HeraclitusDB  
**Componentes principais:** `heraclitus-log`, `heraclitus-index-graph`, `hume-kernel`, `heraclitus-compliance`, `heraclitus-sentinel`, `heraclitus-server`, `heraclitus-ingestor`

---

# 0. Visão Geral

Esta SPEC define uma plataforma de detecção, correlação e investigação de **indícios de irregularidades envolvendo agentes públicos, empresas, contratos administrativos, benefícios sociais e registros de sanções**, utilizando o HeraclitusDB como mecanismo de:

- ingestão;
- normalização;
- resolução de entidades;
- armazenamento temporal;
- correlação por grafos;
- execução analítica;
- detecção de anomalias;
- geração de alertas;
- preservação de evidências;
- auditoria;
- cadeia de custódia;
- reprodução histórica.

O sistema **não deve declarar automaticamente que uma pessoa praticou fraude**.

Sua função é produzir:

```text
DADO
  ↓
CORRELAÇÃO
  ↓
INDÍCIO
  ↓
ALERTA
  ↓
EVIDÊNCIA REPRODUZÍVEL
  ↓
ANÁLISE HUMANA
```

Um alerta representa uma **hipótese investigativa fundamentada**, não uma conclusão jurídica.

---

# 1. Objetivos

## 1.1 Objetivos funcionais

O sistema deve ser capaz de:

1. integrar datasets públicos e autorizados de múltiplas fontes;
2. resolver entidades mesmo quando identificadores aparecem parcialmente mascarados;
3. modelar relações temporais entre pessoas, empresas, órgãos, contratos, pagamentos e sanções;
4. executar regras determinísticas de risco;
5. executar detecção estatística e baseada em grafos;
6. identificar relações indiretas de segundo e terceiro grau;
7. registrar cada alerta de forma imutável;
8. explicar exatamente por que o alerta foi produzido;
9. permitir reconstrução histórica `AS OF LSN`;
10. preservar proveniência dos registros;
11. gerar dossiê técnico reproduzível;
12. permitir revisão humana e contestação.

---

# 2. Princípios de Projeto

O sistema deve obedecer aos seguintes princípios.

### P1 — Nenhuma inferência sem proveniência

Todo fato usado por uma regra deve possuir:

```text
dataset
arquivo_origem
linha/registro
competência
timestamp_ingestao
hash_origem
LSN
```

### P2 — Identidade não é igualdade textual

Nome igual não significa pessoa igual.

### P3 — CPF mascarado não pode produzir match definitivo sozinho

Correspondência baseada em identificador parcial deve carregar confiança explícita.

### P4 — Temporalidade é obrigatória

Relações devem ser avaliadas no período em que efetivamente coexistiram.

### P5 — Regra não é condenação

Uma regra produz:

```text
RiskSignal
```

e não:

```text
FraudConfirmed
```

### P6 — Resultado deve ser reproduzível

Um alerta deve poder ser recalculado usando o mesmo snapshot lógico.

### P7 — Ausência de informação não significa ausência de risco

Use:

```text
KNOWN
UNKNOWN
NOT_APPLICABLE
CONFLICTING
```

Nunca transforme ausência em falso negativo.

---

# 3. Arquitetura

```text
              FONTES DE DADOS
                    │
       ┌────────────┼────────────┐
       │            │            │
     SIAPE         RFB        COMPRAS
       │            │            │
       ├────────────┼────────────┤
       │            │            │
      CEAF      BENEFÍCIOS    SANÇÕES
       │            │            │
       └────────────┬────────────┘
                    ▼
         HERACLITUS INGESTOR
                    │
           Normalização / QA
                    │
                    ▼
          ENTITY RESOLUTION
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
   Canonical Log           Entity Graph
     HRKL V6          heraclitus-index-graph
        │                       │
        └───────────┬───────────┘
                    ▼
               HUME ENGINE
             regras + analytics
                    │
                    ▼
              RISK SIGNALS
                    │
                    ▼
              SENTINEL
          correlação / incidentes
                    │
                    ▼
           EVIDENCE RECEIPT
                    │
        Merkle / RFC3161 / LSN
                    │
                    ▼
        INVESTIGATION CONSOLE
```

---

# 4. Modelo Canônico de Entidades

## 4.1 Pessoa

```rust
Person {
    entity_id: EntityId,
    canonical_name: String,
    normalized_name: String,

    cpf_full_hash: Option<Hash>,
    cpf_masked_fragment: Option<String>,

    birth_date: Option<Date>,
    mother_name_hash: Option<Hash>,
    municipality_ibge: Option<String>,

    resolution_confidence: f32,
    resolution_method: ResolutionMethod,

    valid_from: Timestamp,
    valid_to: Option<Timestamp>,

    provenance: Vec<SourceRef>,
}
```

---

# 5. Entity Resolution

A fórmula original:

```text
SHA256(
    NORMALIZE(NOME)
    + CPF_CENTRAL_6DIG
    + UF
)
```

não deve ser utilizada como identidade definitiva.

Ela pode gerar:

- colisões;
- homônimos;
- mudança de UF;
- falso vínculo entre pessoas;
- fragmentação da mesma pessoa.

## 5.1 Estratégia em múltiplas camadas

### Tier 0 — Identidade determinística

Quando existir identificador completo confiável:

```text
CPF completo
CNPJ completo
matrícula funcional + órgão
```

produzir match:

```text
confidence = 1.0
```

---

### Tier 1 — Identidade pseudonimizada

CPF completo disponível apenas durante ingestão:

```text
HMAC-SHA256(
    segredo_institucional,
    CPF_NORMALIZADO
)
```

O CPF puro não precisa permanecer no grafo.

Preferir HMAC a SHA-256 simples para evitar ataques por dicionário.

---

### Tier 2 — Identificador parcialmente mascarado

Usar conjunto de características:

```text
nome normalizado
fragmento CPF
município
UF
órgão
matrícula parcial
data nascimento
nome mãe
cargo
```

quando disponíveis.

Resultado:

```rust
EntityResolution {
    candidate_a,
    candidate_b,

    score,

    evidence: [
        NameExact,
        CpfFragmentMatch,
        SameMunicipality,
        SameAgency,
        BirthDateMatch,
    ]
}
```

---

## 5.2 Níveis de confiança

```text
>= 0.98    VERIFIED_MATCH
0.90-0.98  HIGH_CONFIDENCE
0.75-0.90  POSSIBLE_MATCH
< 0.75     NO_AUTOMATIC_LINK
```

Arestas investigativas abaixo de `0.98` devem carregar:

```text
resolution_confidence
resolution_method
```

---

# 6. Entidades

Tipos mínimos:

```text
:Person
:PublicServant
:Pensioner
:Company
:Agency
:Contract
:Procurement
:Benefit
:Sanction
:Payment
:BankOrder
:Office
:Municipality
:Evidence
:RiskSignal
:Investigation
```

---

# 7. Grafo de Relações

## 7.1 Relações principais

```text
PublicServant --EMPLOYED_BY--> Agency

Person --PARTNER_OF--> Company

Company --CONTRACTED_BY--> Agency

Company --PARTICIPATED_IN--> Procurement

Person --RECEIVED--> Benefit

Person --SUBJECT_TO--> Sanction

Agency --ISSUED--> Payment

Payment --RELATED_TO--> Contract

RiskSignal --INVOLVES--> Entity

Evidence --SUPPORTS--> RiskSignal
```

---

# 8. Temporalidade

Toda relação relevante deve suportar:

```rust
valid_from
valid_to

recorded_at
source_effective_date
```

O sistema deve distinguir:

```text
VALID TIME
```

de:

```text
TRANSACTION TIME
```

Exemplo:

```text
Servidor tornou-se sócio em 2023.
Dataset foi ingerido em 2026.
```

Isso não significa que a relação começou em 2026.

---

# 9. Regra Temporal Fundamental

Uma trilha só pode considerar duas relações simultâneas quando:

```text
intersection(
    relationship_A.valid_period,
    relationship_B.valid_period
) != ∅
```

Esse ponto é obrigatório para reduzir falsos positivos históricos.

---

# 10. Modelo de RiskSignal

```rust
RiskSignal {
    signal_id: Ulid,

    rule_id: String,
    rule_version: String,

    severity: Severity,

    confidence: f32,

    entities: Vec<EntityRef>,

    evidence: Vec<EvidenceRef>,

    first_lsn: Lsn,
    last_lsn: Lsn,

    effective_period: TimeRange,

    monetary_exposure: Option<Money>,

    explanation: Explanation,

    state: SignalState,
}
```

Estados:

```text
NEW
TRIAGE
UNDER_REVIEW
DISMISSED
ESCALATED
CONFIRMED_BY_AUTHORITY
CLOSED
```

---

# 11. Motor de Regras

Regra nunca deve ficar hardcoded no código quando depender de critério normativo variável.

Usar:

```yaml
id: FRD-001
version: 2026.09

name: conflict_of_interest_contract

severity: critical

conditions:
  servant.employed_by == contract.agency
  person.partner_of == contract.company
  partner.role in:
    - administrator
    - managing_partner
    - owner

temporal:
  require_overlap: true
```

---

# 12. Versionamento Normativo

Limites como renda, benefício, vínculo ou condição jurídica devem ser configurados por:

```text
competência
norma
versão
vigência inicial
vigência final
```

Nunca:

```rust
if salario > 1500
```

Diretamente no código.

Usar:

```rust
threshold_for(
    rule,
    competence
)
```

Isso evita transformar uma regra válida em 2024 numa conclusão errada em 2026.

---

# 13. Trilha A — Conflito Societário / Contratual

## Descrição

Pessoa com vínculo funcional com órgão possui participação societária relevante em empresa contratada pelo mesmo órgão.

### Severidade inicial

```text
HIGH
```

Pode subir para:

```text
CRITICAL
```

quando existirem fatores agravantes.

---

## Condições

```text
Servidor S
    EMPLOYED_BY
Órgão O

Pessoa S
    PARTNER_OF
Empresa E

Empresa E
    CONTRACTED_BY
Órgão O
```

e:

```text
temporal_overlap == true
```

---

## Agravantes

```text
role == administrador
contract_value alto
servidor exerce função de contratação
servidor participa de comissão
contrato iniciado após entrada societária
pagamentos recorrentes
contratação direta
```

---

# 14. Trilha B — Potencial Incompatibilidade entre Benefício e Renda

Não usar:

```text
salário > valor fixo
=> fraude
```

Usar:

```text
benefit_eligibility_rule(
    benefit_type,
    competence,
    household_context
)
```

Resultado:

```text
POSSIBLE_ELIGIBILITY_INCONSISTENCY
```

e não:

```text
BENEFIT_FRAUD
```

---

# 15. Trilha C — Incompatibilidade Patrimonial/Societária

Pessoa com renda conhecida aparentemente incompatível com participação societária elevada.

O sistema deve chamar isso de:

```text
WEALTH_OR_OWNERSHIP_ANOMALY
```

e nunca automaticamente de:

```text
LARANJA
```

Indicadores:

```text
capital social elevado
mudança societária abrupta
múltiplas empresas
empresa recém-aberta
empresa com contratos públicos
endereço compartilhado
sócios recorrentes
rede empresarial densa
```

---

# 16. Trilha D — Sanção e Vínculo Funcional Posterior

```text
Person
   SUBJECT_TO
Sanction

Person
   EMPLOYED_BY
Agency
```

Verificar:

```text
tipo da sanção
vigência
efeitos jurídicos registrados
data início
data término
eventual reversão
decisão judicial
reintegração
anulação
```

Um registro histórico de demissão não significa necessariamente vínculo atual irregular.

Portanto a saída deve ser:

```text
SANCTION_EMPLOYMENT_INCONSISTENCY
```

até revisão.

---

# 17. Nova Trilha E — Rede Societária Recorrente

Detectar empresas distintas com:

```text
mesmos sócios
mesmo endereço
mesmo telefone
mesmo contador
mesmo domínio
mesmos procuradores
```

e contratos com múltiplos órgãos.

Pode identificar:

```text
cluster empresarial
```

ou possível grupo econômico.

---

# 18. Nova Trilha F — Fragmentação Contratual

Detectar sequência:

```text
Empresa E
+
Órgão O
+
período curto
+
múltiplos contratos pequenos
```

cujo valor agregado apresenta padrão anômalo.

---

# 19. Nova Trilha G — Concentração Anormal

Comparar:

```text
empresa
órgão
modalidade
objeto
região
```

com distribuição histórica.

Algoritmos:

```text
z-score
MAD
percentile
Isolation Forest externo/opcional
graph centrality
```

Resultado:

```text
PROCUREMENT_CONCENTRATION_ANOMALY
```

---

# 20. Nova Trilha H — Relação Indireta

Exemplo:

```text
Servidor A
   |
   +-- parente / sócio / endereço
             |
             v
          Pessoa B
             |
             v
          Empresa X
             |
             v
          Órgão A
```

Suportar:

```text
2-hop
3-hop
4-hop
```

com penalização de confiança por distância.

---

# 21. Score de Risco

Não utilizar apenas severidade estática.

```text
risk_score =
    rule_weight
  * resolution_confidence
  * temporal_confidence
  * source_reliability
  * monetary_factor
  * network_factor
```

Normalizar:

```text
0.00 - 1.00
```

Classificação:

```text
0.00–0.39 LOW
0.40–0.64 MEDIUM
0.65–0.84 HIGH
0.85–1.00 CRITICAL
```

---

# 22. Explicabilidade

Todo alerta deve produzir explicação estruturada.

Exemplo:

```json
{
  "rule": "FRD-CONTRACT-001",
  "risk_score": 0.94,
  "reasons": [
    "Servidor vinculado ao órgão durante o período contratual",
    "Servidor consta como administrador da empresa",
    "Empresa recebeu contrato do mesmo órgão"
  ]
}
```

---

# 23. Proveniência

Cada campo deve possuir:

```rust
SourceRef {
    dataset_id,
    dataset_version,
    file_hash,
    row_number,
    source_url,
    source_timestamp,
    ingestion_lsn,
}
```

---

# 24. Imutabilidade

Ao produzir um alerta:

```text
RiskSignal
EvidenceSet
RuleVersion
EntitySnapshot
```

devem ser registrados no HRKL.

---

# 25. Snapshot Investigativo

Cada alerta crítico deve registrar:

```text
analysis_lsn
```

Permitindo:

```text
heraclitus query --as-of-lsn <LSN>
```

reconstruir a investigação.

---

# 26. Merkle Proof

Para cada EvidenceSet crítico:

```text
record_hash
segment_root
Merkle proof
LSN
```

---

# 27. RFC 3161

O carimbo de tempo deve ser opcional durante triagem.

Obrigatório apenas quando:

```text
alert escalated
evidence exported
investigation formally opened
```

---

# 28. Dashboard Executivo

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ HERACLITUS PUBLIC INTEGRITY                                                 │
│ Snapshot LSN: 18.492.441 │ Data freshness: 2h │ Integrity: VERIFIED         │
├──────────────────────────────────────────────────────────────────────────────┤
│ CRITICAL 12 │ HIGH 84 │ MEDIUM 412 │ UNDER REVIEW 39 │ DISMISSED 117        │
├──────────────────────────────────────────────────────────────────────────────┤
│ CONTRACTUAL EXPOSURE                                                        │
│ R$ 18.420.500                                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ TOP SIGNALS                                                                 │
│ S9.4  Conflict relationship                    R$ 3.2M                       │
│ S9.1  Sanction/employment inconsistency        R$ 22K                        │
│ S8.7  Procurement concentration                R$ 5.8M                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

# 29. Fila de Triagem

Colunas:

```text
Risk
Confidence
Rule
Person
Company
Agency
Exposure
Evidence count
First observed
Status
Assignee
```

---

# 30. Investigação em Grafo

A tela deve mostrar:

```text
Pessoa
Empresa
Órgão
Contrato
Pagamento
Sanção
Benefício
```

Cada aresta deve exibir:

```text
tipo
período
confidence
source
```

---

# 31. Time Travel

Adicionar slider:

```text
2022 ──────────●──────────── 2026
```

O grafo deve recalcular usando:

```text
AS OF VALID TIME
```

ou:

```text
AS OF LSN
```

---

# 32. Dossiê Probatório

Exemplo:

```text
ALERTA #9481

Rule:
FRD-CONTRACT-001 v3

Risk:
0.94 CRITICAL

Confidence:
0.997

Analysis snapshot:
LSN 18,492,441

EVIDENCE
────────────────────────────

E1 SIAPE
E2 Receita QSA
E3 Contrato
E4 Pagamento
E5 vínculo temporal

MERKLE
────────────────────────────

Root:
a4bf...

Proof:
VERIFIED
```

---

# 33. Decisão Humana

A interface deve permitir:

```text
ACKNOWLEDGE
DISMISS
REQUEST_MORE_DATA
ESCALATE
OPEN_INVESTIGATION
```

Toda ação deve ser registrada no HRKL.

---

# 34. Audit Trail

Exemplo:

```text
12:03 Signal generated
12:11 Analyst opened
12:17 Evidence expanded
12:44 Analyst requested review
13:20 Supervisor escalated
13:22 RFC3161 sealed
```

---

# 35. Pipeline de Ingestão

```text
DOWNLOAD
   ↓
HASH
   ↓
VALIDATE
   ↓
PARSE
   ↓
NORMALIZE
   ↓
QUALITY CHECK
   ↓
ENTITY RESOLUTION
   ↓
APPEND HRKL
   ↓
UPDATE INDEXES
```

---

# 36. Manifest de Dataset

Cada carga precisa gerar:

```json
{
  "dataset": "SIAPE_REMUNERACAO",
  "competence": "2026-08",
  "source": "...",
  "sha256": "...",
  "rows_read": 9048213,
  "rows_accepted": 9048011,
  "rows_rejected": 202,
  "ingestion_started_lsn": 12000000,
  "ingestion_finished_lsn": 21048213
}
```

---

# 37. Data Quality

Medir:

```text
missing identifiers
invalid CPF
invalid CNPJ
duplicate records
malformed dates
unknown agency
unresolved person
ambiguous match
```

---

# 38. Entity Resolution Quality

Dashboard interno:

```text
VERIFIED_MATCH        91.4%
HIGH_CONFIDENCE        5.8%
POSSIBLE_MATCH         2.1%
UNRESOLVED             0.7%
```

---

# 39. Controle de Falso Positivo

Cada regra deve possuir benchmark.

Dataset rotulado:

```text
known-positive
known-negative
ambiguous
```

Medir:

```text
precision
recall
false positive rate
false negative rate
```

---

# 40. Reprodutibilidade

Para cada RiskSignal:

```text
rule version
dataset manifests
analysis LSN
query hash
engine version
binary hash
```

---

# 41. Performance

Objetivo inicial:

### Ingestão

```text
>= 100k registros/s
```

em hardware de referência definido posteriormente.

### Query de triagem

```text
p95 < 500 ms
```

### Expansão de grafo

```text
2-hop p95 < 200 ms
3-hop p95 < 1 s
```

Os números devem ser tratados como gates mensuráveis, não promessas decorativas.

---

# 42. Segurança

Datasets contendo identificadores pessoais devem utilizar:

```text
RBAC
encryption at rest
audit log
field redaction
HMAC identifiers
least privilege
```

---

# 43. Perfis de Acesso

```text
Viewer
Analyst
SeniorAnalyst
Supervisor
Auditor
Administrator
```

---

# 44. Exportação

Permitir:

```text
PDF
JSON
Evidence Bundle
CSV redigido
Graph snapshot
```

Toda exportação precisa registrar:

```text
who
when
scope
reason
hash
```

---

# 45. Sentinel

Cada RiskSignal pode alimentar:

```text
heraclitus-sentinel
```

para correlação de múltiplos sinais.

Exemplo:

```text
empresa nova
+
contrato elevado
+
sócio servidor
+
concentração contratual
```

isoladamente podem ser sinais médios.

Combinados:

```text
Incident CRITICAL
```

---

# 46. Correlação

```text
RiskSignal
     │
     ▼
Sentinel
     │
     ├── correlation window
     ├── graph proximity
     ├── shared entities
     ├── monetary exposure
     └── repeated pattern
     │
     ▼
Incident
```

---

# 47. Alertas do Sistema

Além dos alertas investigativos, devem existir alertas operacionais:

```text
DATASET_STALE
ENTITY_RESOLUTION_COLLISION
SOURCE_HASH_CHANGED
REPLAY_DIVERGENCE
INDEX_LAG
MERKLE_VERIFY_FAILURE
RFC3161_FAILURE
GRAPH_BUILD_FAILED
RULE_ENGINE_ERROR
```

---

# 48. Testes

## Unitários

```text
normalização
CPF/CNPJ parsing
entity matching
temporal overlap
risk scoring
rule matching
```

## Property Based

Gerar:

```text
homônimos
CPF parcial
mudança de UF
datas sobrepostas
datas não sobrepostas
duplicidades
```

## Integration

```text
ingest
→ entity resolution
→ graph
→ rule
→ RiskSignal
→ receipt
```

---

# 49. Golden Dataset

Criar dataset sintético contendo:

```text
10.000 pessoas
2.000 empresas
100 órgãos
10.000 contratos
100 relações suspeitas conhecidas
```

Resultado esperado deve ser determinístico.

---

# 50. Invariantes

### INV-001

Uma entidade não pode ser declarada `VERIFIED_MATCH` apenas por nome.

### INV-002

CPF mascarado isoladamente nunca produz identidade definitiva.

### INV-003

Uma regra temporal nunca associa relações sem período sobreposto.

### INV-004

Todo RiskSignal aponta para pelo menos uma EvidenceRef.

### INV-005

Toda EvidenceRef aponta para LSN existente.

### INV-006

Uma decisão humana nunca reescreve evidência anterior.

### INV-007

Alterar uma regra cria nova `rule_version`.

### INV-008

Reexecutar a mesma análise no mesmo LSN com a mesma rule version produz resultado equivalente.

### INV-009

Dados derivados podem ser reconstruídos do log canônico.

### INV-010

Nenhum alerta pode transformar automaticamente um indício em imputação de fraude.

---

# 51. Estrutura de Código Recomendada

```text
tools/heraclitus-ingestor/
├── src/
│   ├── datasets/
│   ├── normalize/
│   ├── resolution/
│   │   ├── deterministic.rs
│   │   ├── probabilistic.rs
│   │   ├── confidence.rs
│   │   └── conflicts.rs
│   └── provenance.rs

crates/heraclitus-fraud/
├── src/
│   ├── lib.rs
│   ├── model.rs
│   ├── engine.rs
│   ├── scoring.rs
│   ├── temporal.rs
│   ├── explanation.rs
│   └── rules/
│       ├── contractual.rs
│       ├── benefits.rs
│       ├── sanctions.rs
│       ├── ownership.rs
│       ├── procurement.rs
│       └── networks.rs

crates/heraclitus-compliance/
└── src/
    ├── evidence.rs
    ├── receipt.rs
    └── rfc3161.rs
```

Separar o domínio de fraude/integridade em `heraclitus-fraud` é preferível a transformar `heraclitus-compliance` num crate que faz absolutamente tudo até preparar café.

---

# 52. Fases de Implementação

## Fase 1 — Data Foundation

```text
dataset manifests
normalização
proveniência
entity resolution
```

## Fase 2 — Graph Foundation

```text
entities
temporal edges
indexes
```

## Fase 3 — Deterministic Detection

Implementar:

```text
Trilha A
Trilha B
Trilha D
```

## Fase 4 — Advanced Analytics

```text
network anomaly
contract concentration
fragmentation
graph centrality
```

## Fase 5 — Evidence

```text
receipts
Merkle
LSN
RFC3161
```

## Fase 6 — Investigation Console

```text
dashboard
triage
graph
timeline
dossier
```

## Fase 7 — Sentinel Correlation

```text
multi-signal incident detection
```

---

# 53. Definition of Done

A SPEC só será considerada implementada quando for possível:

1. ingerir dataset real ou sintético;
2. produzir manifest assinado/hashado;
3. resolver entidades com confiança explícita;
4. construir grafo temporal;
5. executar regras versionadas;
6. gerar RiskSignal explicável;
7. reconstruir o sinal a partir do LSN;
8. visualizar entidades e evidências;
9. registrar análise humana;
10. verificar Merkle proof;
11. exportar Evidence Bundle;
12. executar dataset golden sem divergência.

---

# 54. Resultado Esperado

A arquitetura final não deve ser apenas:

```text
"painel que encontra servidor suspeito"
```

Ela deve ser:

```text
Plataforma de Inteligência de Integridade Pública
```

capaz de produzir:

```text
INDÍCIO
+
CONTEXTO
+
TEMPORALIDADE
+
CONFIANÇA
+
PROVENIÊNCIA
+
EXPLICAÇÃO
+
PROVA CRIPTOGRÁFICA
+
REPRODUTIBILIDADE
```

O diferencial do HeraclitusDB deixa então de ser apenas encontrar padrões.

O diferencial passa a ser conseguir responder, para cada alerta:

```text
QUAL dado produziu a hipótese?

DE ONDE esse dado veio?

QUANDO ele era válido?

QUAL regra foi executada?

QUAL versão da regra?

QUAL nível de confiança da identidade?

QUAL era o estado do banco naquele momento?

QUAL LSN registra a evidência?

A evidência mudou desde então?

A análise pode ser reproduzida?
```

É essa combinação que transforma correlação de dados em uma plataforma séria de auditoria e investigação.