/**
 * Golden Demo Dataset for Heraclitus Temporal Reconstruction Workbench.
 * Provides deterministic 52-week activity map, canonical event logs, entities,
 * Merkle roots, time machine checkpoints, diff sets, and Sentinel incidents
 * when offline or in demo mode (?demo=1).
 */

export const GOLDEN_DEMO = {
  headLsn: 18492102n,
  headHlc: 1172238140029n,
  stateHash: "b3:9f2a87c114e05b7661298a00291f04128f",

  // 52-week activity density (364 days of bucketed activity)
  generateActivityMap() {
    const map = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      // Deterministic pseudo-random seed based on index
      const base = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
      const count = Math.floor(Math.abs(base) % 800) + 120;
      const incidents = (i % 37 === 0) ? 1 : 0;
      const verified = i % 7 === 0;
      map.push({
        date: dateStr,
        count: count,
        incidents: incidents,
        verified: verified,
        level: Math.min(4, Math.floor(count / 180))
      });
    }
    return map;
  },

  // Canonical Event Stream
  getCanonicalEvents(limit = 100, maxLsn = 18492102n) {
    const kinds = [
      'EntityCreated', 'FactAsserted', 'RelationAdded', 'AttributeUpdated',
      'FactSuperseded', 'ValidityExpired', 'CryptoShredded', 'ViewCheckpoint'
    ];
    const sources = ['forge', 'iam_gateway', 'pg_sync', 'sentinel_sensor', 'api_edge', 'erp_ingest'];
    const entities = [
      'user:svc-bkp', 'person:cpf-091', 'server:prod-db-02', 'doc:lic-2026-99',
      'account:acc-4410', 'vpn:gw-east'
    ];

    const events = [];
    const count = Math.min(limit, 500);
    const startLsn = maxLsn > BigInt(count * 10) ? maxLsn - BigInt(count * 10) : 1000n;

    for (let i = 0; i < count; i++) {
      const curLsn = startLsn + BigInt(i * 10);
      const kIndex = i % kinds.length;
      const srcIndex = (i * 3) % sources.length;
      const entIndex = (i * 2) % entities.length;
      const sysTime = new Date(Date.now() - (count - i) * 60000).toISOString();
      const valTime = new Date(Date.now() - (count - i + 10) * 60000).toISOString();

      events.push({
        lsn: curLsn,
        hlc: 1172238000000n + BigInt(i * 1420),
        id: `evt_b3_${curLsn.toString(16)}`,
        kind: kinds[kIndex],
        source: sources[srcIndex],
        entity: entities[entIndex],
        systemTime: sysTime,
        validTime: valTime,
        bytes: 128 + (i % 50) * 8,
        merkleRoot: `b3:${(curLsn * 9123n).toString(16).padStart(16, '0')}`,
        sealed: i % 10 !== 9,
        verified: i % 5 !== 0,
        payload: {
          action: kinds[kIndex],
          actor: `svc-role-${(i % 4) + 1}`,
          target: entities[entIndex],
          attributes_changed: (i % 3) + 1
        }
      });
    }
    return events;
  },

  // Checkpoints
  getCheckpoints() {
    return [
      { lsn: 18000000n, hash: "b3:1100aa22bb33cc", timestamp: "2026-09-01 00:00:00 UTC", segments: 118, version: "v1.0.6" },
      { lsn: 18200000n, hash: "b3:4455dd66ee7788", timestamp: "2026-09-04 12:30:00 UTC", segments: 120, version: "v1.0.6" },
      { lsn: 18400000n, hash: "b3:99001122334455", timestamp: "2026-09-08 18:15:00 UTC", segments: 124, version: "v1.0.6" }
    ];
  },

  // Diff comparison between State A (18,200,000) and State B (18,492,102)
  getDiff(lsnA = 18200000n, lsnB = 18492102n) {
    return {
      lsnA: lsnA,
      lsnB: lsnB,
      hashA: "b3:4455dd66ee7788",
      hashB: "b3:9f2a87c114e05b7661298a00291f04128f",
      summary: {
        created: 184,
        changed: 91,
        semanticRemoved: 12,
        validityExpired: 3,
        superseded: 27,
        cryptoShredded: 4
      },
      items: [
        {
          id: "person:cpf-091",
          type: "ENTITY",
          change: "SEMANTIC_REMOVAL",
          detail: "Entidade desativada fisicamente via tombstone no LSN 18,311,491",
          lsn: 18311491n,
          whyEvent: "evt_b3_1176b63",
          cause: "Ordem revogada pelo controller IAM"
        },
        {
          id: "server:prod-db-02",
          type: "RELATION",
          change: "SUPERSEDED",
          detail: "Relação REL_ACCESS substituída por fato posterior",
          lsn: 18410020n,
          whyEvent: "evt_b3_118ebd4",
          cause: "Atualização de topologia do cluster PostgreSQL"
        },
        {
          id: "doc:lic-2026-99",
          type: "ATTRIBUTE",
          change: "VALIDITY_EXPIRED",
          detail: "Validade legal encerrada no Valid Time 2026-09-07T23:59:59Z",
          lsn: 18450100n,
          whyEvent: "evt_b3_1198884",
          cause: "Decorrência do prazo regulatório de retenção"
        },
        {
          id: "account:acc-4410",
          type: "CRYPTO_SHRED",
          change: "CRYPTO_SHRED",
          detail: "Chave do atributo de PII triturada criptograficamente (LGPD Art. 18)",
          lsn: 18489000n,
          whyEvent: "evt_b3_11a2110",
          cause: "Solicitação formal do titular confirmada e provada"
        }
      ]
    };
  },

  // View Lag Watermarks
  getWatermarks() {
    return {
      head: 18492102n,
      views: [
        { name: "Graph Engine (HVM)", watermark: 18492102n, lag: 0, status: "OK" },
        { name: "Text Search Index", watermark: 18492102n, lag: 0, status: "OK" },
        { name: "Vector Index (HNSW)", watermark: 18491884n, lag: 218, status: "LAGGING" },
        { name: "Attribute Registry", watermark: 18492101n, lag: 1, status: "OK" },
        { name: "Sentinel Threat Correlation", watermark: 18492102n, lag: 0, status: "OK" }
      ]
    };
  },

  // Provenance Nodes & Edges
  getProvenanceGraph(cursorLsn = 18492102n) {
    return {
      nodes: [
        { id: "evt_1", label: "Login VPN (IP 187.*)", type: "EVENT", lsn: 18440000n, status: "CANONICAL" },
        { id: "evt_2", label: "Privilégio elevado", type: "EVENT", lsn: 18440050n, status: "CANONICAL" },
        { id: "evt_3", label: "Movimento lateral (Servidor B)", type: "EVENT", lsn: 18440100n, status: "CANONICAL" },
        { id: "ent_svc", label: "svc-bkp", type: "ENTITY", lsn: 18440000n, status: "DERIVED" },
        { id: "fact_pg", label: "Acesso Postgres", type: "FACT", lsn: 18440120n, status: "DERIVED" },
        { id: "inc_01", label: "INC-2026-0012 Anomalia", type: "INCIDENT", lsn: 18440150n, status: "INFERRED" },
        { id: "proof_1", label: "Merkle Root b3:9f2a…", type: "RECEIPT", lsn: 18440200n, status: "VERIFIED" }
      ],
      edges: [
        { from: "evt_1", to: "evt_2", label: "CAUSED_BY" },
        { from: "evt_2", to: "evt_3", label: "DERIVED_FROM" },
        { from: "evt_2", to: "ent_svc", label: "RESOLVED_TO" },
        { from: "evt_3", to: "fact_pg", label: "PRODUCED_BY" },
        { from: "fact_pg", to: "inc_01", label: "SUPPORTED_BY" },
        { from: "inc_01", to: "proof_1", label: "DEPENDS_ON" }
      ]
    };
  }
};
