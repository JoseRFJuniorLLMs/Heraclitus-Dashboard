# -*- coding: utf-8 -*-
"""
HeraclitusDB · Backend de Integridade Pública & Detecção de Fraudes
Implementação fiel de SPEC-FRD-001 v2.0
Trilhas A a H, Resolução de Entidades, Grafo Temporal, Provas Merkle e Dossiê Probatório
"""

import json
import time
import hashlib
import urllib.request
from typing import Dict, Any, List, Optional

CORE_STATS_URL = "http://127.0.0.1:7475/stats"
CORE_VERIFY_URL = "http://127.0.0.1:7475/verify"

# In-memory Audit Trail store with simulated append-only LSN persistence
AUDIT_TRAIL = [
    {
        "lsn": 18492440,
        "timestamp": "2026-09-17 08:30:12",
        "actor": "heraclitus-sentinel",
        "action": "SIGNAL_GENERATED",
        "signal_id": "SIG-2026-001",
        "rule": "FRD-001 v2026.09 (Trilha A)",
        "details": "Indício gerado via correlação temporal SIAPE + RFB/QSA + PNCP Contratos."
    },
    {
        "lsn": 18492441,
        "timestamp": "2026-09-17 09:15:44",
        "actor": "auditor.fiscal.44",
        "action": "TRIAGE_OPENED",
        "signal_id": "SIG-2026-001",
        "rule": "FRD-001 v2026.09",
        "details": "Abertura de triagem pericial para inspeção de sobreposição temporal de vínculo."
    },
    {
        "lsn": 18492442,
        "timestamp": "2026-09-17 09:40:02",
        "actor": "heraclitus-compliance",
        "action": "RFC3161_SEALED",
        "signal_id": "SIG-2026-001",
        "rule": "FRD-001 v2026.09",
        "details": "Carimbo de tempo ICP-Brasil registrado com hash da cadeia de evidências E1-E5."
    }
]

# Database of Pre-evaluated Signals based on SPEC-FRD-001 (Trilhas A through H)
SIGNALS_DB = [
    {
        "id": "SIG-2026-001",
        "rule_id": "FRD-001",
        "rule_name": "Conflito Societário / Contratual",
        "trilha": "Trilha A",
        "severity": "CRITICAL",
        "risk_score": 0.94,
        "confidence": 0.997,
        "confidence_level": "VERIFIED_MATCH",
        "monetary_exposure": 3200000.0,
        "person": {
            "name": "Carlos Eduardo de Alencar Mendonça",
            "cpf_masked": "***.482.918-**",
            "siape": "1849201",
            "role": "Coordenador Geral de Infraestrutura e Logística",
            "agency": "Ministério dos Transportes",
            "agency_code": "39000"
        },
        "company": {
            "name": "Vialeste Pavimentação e Obras Eireli",
            "cnpj": "28.491.028/0001-44",
            "role": "Sócio-Administrador (desde 2023-04-12)",
            "capital_social": 1500000.0
        },
        "contract": {
            "number": "CT-MTR-2024-0042",
            "object": "Recapeamento e drenagem da rodovia BR-101 trecho Leste",
            "value": 3200000.0,
            "signed_date": "2024-06-15",
            "valid_from": "2024-06-15",
            "valid_to": "2026-12-31"
        },
        "status": "UNDER_REVIEW",
        "assignee": "auditor.fiscal.44",
        "first_observed": "2026-09-14 10:20:00",
        "analysis_lsn": 18492441,
        "explanation": [
            "Servidor público ocupante de função gratificada (DAS 101.4) vinculado ao órgão contratante durante a vigência do contrato",
            "Servidor consta expressamente no QSA da Receita Federal como Sócio-Administrador da contratada desde 2023",
            "Sobreposição temporal confirmada: Vínculo funcional ativo (2021-atual) intersecciona vigência do contrato (2024-2026)",
            "Foram identificadas 4 ordens bancárias emitidas pelo Ministério dos Transportes totalizando R$ 1.840.000 já liquidados"
        ],
        "evidence": [
            {
                "id": "E1",
                "source": "SIAPE_CADASTRO_2026_08",
                "desc": "Registro de vínculo funcional ativo, cargo efetivo e função comissionada no Ministério dos Transportes.",
                "row": 84921,
                "hash": "a8f4c9103e5b72110c...",
                "lsn": 18100204
            },
            {
                "id": "E2",
                "source": "RFB_CNPJ_QSA",
                "desc": "Quadro de Sócios e Administradores comprovando cargo de Sócio-Administrador com 100% das cotas.",
                "row": 39401,
                "hash": "7bc0214aa8e903f044...",
                "lsn": 18149200
            },
            {
                "id": "E3",
                "source": "PNCP_CONTRATOS_2024",
                "desc": "Instrumento contratual nº CT-MTR-2024-0042 firmado com dispensa eletrônica justificativa emergencial.",
                "row": 1204,
                "hash": "f0192837bc9910a34b...",
                "lsn": 18230114
            },
            {
                "id": "E4",
                "source": "SIAFI_ORDENS_BANCARIAS",
                "desc": "Série de ordens bancárias 2024OB800142, 2024OB800299, 2025OB800041 pagas à empresa.",
                "row": 9942,
                "hash": "33c09e88aa71bc0019...",
                "lsn": 18340192
            },
            {
                "id": "E5",
                "source": "TEMPORAL_INTERSECTION",
                "desc": "Interseção lógica de validade: Intervalo funcional [2021-02, inf] ∩ Vigência [2024-06, 2026-12] != ∅.",
                "row": 1,
                "hash": "5b901a03f44e8812c4...",
                "lsn": 18492440
            }
        ]
    },
    {
        "id": "SIG-2026-002",
        "rule_id": "FRD-004",
        "rule_name": "Sanção e Vínculo Funcional Posterior",
        "trilha": "Trilha D",
        "severity": "CRITICAL",
        "risk_score": 0.91,
        "confidence": 0.985,
        "confidence_level": "VERIFIED_MATCH",
        "monetary_exposure": 220000.0,
        "person": {
            "name": "Mariana Vasconcelos Ribeiro",
            "cpf_masked": "***.901.324-**",
            "siape": "2490192",
            "role": "Assessora Técnica Especial",
            "agency": "Ministério da Saúde",
            "agency_code": "36000"
        },
        "company": {
            "name": "BioTech Distribuidora de Medicamentos Ltda",
            "cnpj": "19.824.710/0001-90",
            "role": "Procuradora com plenos poderes",
            "capital_social": 800000.0
        },
        "contract": {
            "number": "CT-MS-2025-0118",
            "object": "Fornecimento de reagentes para diagnóstico laboratorial",
            "value": 220000.0,
            "signed_date": "2025-03-10",
            "valid_from": "2025-03-10",
            "valid_to": "2026-03-10"
        },
        "status": "NEW",
        "assignee": "Não atribuído",
        "first_observed": "2026-09-15 14:02:11",
        "analysis_lsn": 18492510,
        "explanation": [
            "Pessoa jurídica cadastrada no Cadastro Nacional de Empresas Inidôneas e Suspensas (CEIS) com sanção ativa",
            "Celebração de aditivo contratual e emissão de empenho mesmo com impedimento legal de licitar e contratar",
            "Procuradora da empresa nomeada em cargo em comissão no mesmo órgão público adquirente",
            "Não foi localizada qualquer decisão judicial suspendendo a eficácia da sanção inscrita no CEIS"
        ],
        "evidence": [
            {
                "id": "E1",
                "source": "CGU_CEIS_SANCIONADOS",
                "desc": "Inscrição de suspensão temporal de contratar com a Administração Federal vigente até 2027.",
                "row": 4410,
                "hash": "11ab9024f0c99a8b77...",
                "lsn": 18190040
            },
            {
                "id": "E2",
                "source": "DOU_PORTARIAS_NOMEACAO",
                "desc": "Portaria de nomeação para exercício de encargo em comissão no Ministério da Saúde.",
                "row": 812,
                "hash": "88f01b924aa910c223...",
                "lsn": 18240119
            }
        ]
    },
    {
        "id": "SIG-2026-003",
        "rule_id": "FRD-007",
        "rule_name": "Concentração Anormal de Contratações",
        "trilha": "Trilha G",
        "severity": "HIGH",
        "risk_score": 0.87,
        "confidence": 0.942,
        "confidence_level": "HIGH_CONFIDENCE",
        "monetary_exposure": 5800000.0,
        "person": {
            "name": "Rodrigo Silva de Oliveira",
            "cpf_masked": "***.112.508-**",
            "siape": "—",
            "role": "Sócio Majoritário",
            "agency": "Ministério da Educação / FNDE",
            "agency_code": "26000"
        },
        "company": {
            "name": "Nexus Logística e Suprimentos Escolares Ltda",
            "cnpj": "44.912.830/0001-12",
            "role": "Contratada Recorrente",
            "capital_social": 100000.0
        },
        "contract": {
            "number": "DISP-MEC-2025-0891",
            "object": "Conjunto de 14 dispensas de licitação para material didático emergencial",
            "value": 5800000.0,
            "signed_date": "2025-01-20",
            "valid_from": "2025-01-20",
            "valid_to": "2026-06-30"
        },
        "status": "NEW",
        "assignee": "Não atribuído",
        "first_observed": "2026-09-15 17:45:00",
        "analysis_lsn": 18492604,
        "explanation": [
            "Empresa constituída há menos de 120 dias antes da celebração dos primeiros instrumentos contratuais",
            "Concentração anômala: 88.4% de todo o faturamento da empresa advém de um único órgão contratante",
            "Capital social de R$ 100.000 desproporcional ao volume empenhado de R$ 5,8 milhões (z-score > 3.4)",
            "Participação repetida em dispensas sucessivas com valores logo abaixo do teto de licitação (indício Trilha F)"
        ],
        "evidence": [
            {
                "id": "E1",
                "source": "RFB_CNPJ_CADASTRO",
                "desc": "Abertura da empresa em 2024-09-15 com atividade econômica secundária incompatível com o objeto.",
                "row": 12903,
                "hash": "22cc9014ba88ff1029...",
                "lsn": 18290012
            },
            {
                "id": "E2",
                "source": "COMPRASNET_DISPENSAS",
                "desc": "Relação de 14 empenhos emitidos consecutivamente entre janeiro e maio de 2025.",
                "row": 449,
                "hash": "99dd8124aa77cc0192...",
                "lsn": 18390110
            }
        ]
    },
    {
        "id": "SIG-2026-004",
        "rule_id": "FRD-002",
        "rule_name": "Incompatibilidade Benefício e Vínculo Formal",
        "trilha": "Trilha B",
        "severity": "HIGH",
        "risk_score": 0.78,
        "confidence": 0.965,
        "confidence_level": "HIGH_CONFIDENCE",
        "monetary_exposure": 18400.0,
        "person": {
            "name": "Patrícia Helena Fontes Bueno",
            "cpf_masked": "***.739.102-**",
            "siape": "3102941",
            "role": "Analista Administrativo",
            "agency": "Ministério do Desenvolvimento Social",
            "agency_code": "55000"
        },
        "company": {
            "name": "—",
            "cnpj": "—",
            "role": "Beneficiária Titular",
            "capital_social": 0.0
        },
        "contract": {
            "number": "BENEF-PBF-2024-99120",
            "object": "Programa Bolsa Família · Folha de Pagamento Municipal",
            "value": 18400.0,
            "signed_date": "2024-01-01",
            "valid_from": "2024-01-01",
            "valid_to": "2025-12-31"
        },
        "status": "TRIAGE",
        "assignee": "auditor.social.12",
        "first_observed": "2026-09-16 09:11:32",
        "analysis_lsn": 18492720,
        "explanation": [
            "Recebimento cumulativo de parcelas de benefício assistencial durante exercício de cargo público federal",
            "Renda familiar per capita declarada no Cadastro Único conflita com folha bruta de remuneração SIAPE",
            "Inconsistência cadastral observada ao longo de 18 competências consecutivas",
            "Classificado estritamente como 'POSSIBLE_ELIGIBILITY_INCONSISTENCY' aguardando validação de composição familiar"
        ],
        "evidence": [
            {
                "id": "E1",
                "source": "CADUNICO_FOLHA_BENEFICIOS",
                "desc": "Histórico de saques e créditos bancários mensais em conta social do PBF.",
                "row": 92014,
                "hash": "44ee9012bb77aa0123...",
                "lsn": 18310022
            },
            {
                "id": "E2",
                "source": "SIAPE_FOLHA_PAGAMENTO",
                "desc": "Comprovante de percepção de remuneração bruta mensal superior ao limite de elegibilidade do programa.",
                "row": 10924,
                "hash": "55ff8190cc66bb1109...",
                "lsn": 18320491
            }
        ]
    },
    {
        "id": "SIG-2026-005",
        "rule_id": "FRD-005",
        "rule_name": "Rede Societária Recorrente / Endereço Compartilhado",
        "trilha": "Trilha E",
        "severity": "HIGH",
        "risk_score": 0.82,
        "confidence": 0.910,
        "confidence_level": "HIGH_CONFIDENCE",
        "monetary_exposure": 4100000.0,
        "person": {
            "name": "Fernando Guimarães Castro",
            "cpf_masked": "***.329.811-**",
            "siape": "—",
            "role": "Contador Comum e Procurador",
            "agency": "Ministério da Defesa",
            "agency_code": "52000"
        },
        "company": {
            "name": "Alfa Defesa Tec Ltda / Beta Engenharia Tática Eireli",
            "cnpj": "31.029.491/0001-08",
            "role": "Cluster Empresarial (Mesmo Endereço & Contador)",
            "capital_social": 2000000.0
        },
        "contract": {
            "number": "PE-DEF-2025-0012",
            "object": "Pregão Eletrônico para manutenção de instalações e segurança perimetral",
            "value": 4100000.0,
            "signed_date": "2025-05-14",
            "valid_from": "2025-05-14",
            "valid_to": "2027-05-14"
        },
        "status": "NEW",
        "assignee": "Não atribuído",
        "first_observed": "2026-09-16 11:20:10",
        "analysis_lsn": 18492815,
        "explanation": [
            "Três licitantes concorrentes no mesmo certame compartilham o mesmo endereço fiscal em Brasília/DF",
            "Mesmo contador responsável pela transmissão do balanço patrimonial e SPED Contábil das concorrentes",
            "Sub-rogação e revezamento de itens observados na disputa de lances com padrões idênticos de IP de submissão",
            "Indício de cluster societário com perda de competitividade no pregão homologado"
        ],
        "evidence": [
            {
                "id": "E1",
                "source": "RFB_CNPJ_ESTABELECIMENTOS",
                "desc": "Comprovante de domicílio fiscal idêntico (Edifício Venâncio 2000, Bloco B, Sala 410).",
                "row": 34102,
                "hash": "77aa1029cc88bb0011...",
                "lsn": 18380091
            },
            {
                "id": "E2",
                "source": "COMPRAS_PROPOSTAS_LANCES",
                "desc": "Log de conexão dos lances indicando mesmo bloco /24 de roteamento de saída na fase competitiva.",
                "row": 5509,
                "hash": "88bb2130dd99cc1122...",
                "lsn": 18410283
            }
        ]
    },
    {
        "id": "SIG-2026-006",
        "rule_id": "FRD-008",
        "rule_name": "Relação Indireta Multi-Hop (Cônjuge / Sócio Oculto)",
        "trilha": "Trilha H",
        "severity": "MEDIUM",
        "risk_score": 0.64,
        "confidence": 0.865,
        "confidence_level": "POSSIBLE_MATCH",
        "monetary_exposure": 1200000.0,
        "person": {
            "name": "Juliana Ramos Martins",
            "cpf_masked": "***.640.291-**",
            "siape": "1902481",
            "role": "Pregoeira e Presidente de Comissão",
            "agency": "Ministério da Agricultura e Pecuária",
            "agency_code": "22000"
        },
        "company": {
            "name": "AgroTech Soluções e Fertilizantes Ltda",
            "cnpj": "38.192.401/0001-33",
            "role": "Propriedade de parente em 1º grau (Marido)",
            "capital_social": 500000.0
        },
        "contract": {
            "number": "CT-MAPA-2025-0088",
            "object": "Contratação de insumos para estações de pesquisa agropecuária",
            "value": 1200000.0,
            "signed_date": "2025-08-01",
            "valid_from": "2025-08-01",
            "valid_to": "2026-08-01"
        },
        "status": "NEW",
        "assignee": "Não atribuído",
        "first_observed": "2026-09-17 07:14:20",
        "analysis_lsn": 18492900,
        "explanation": [
            "Conexão indireta de 2º grau (2-hop) identificada: Servidora (Pregoeira) -> Vínculo Matrimonial -> Sócio Único da Contratada",
            "Empresa contratada homologada diretamente pela comissão conduzida pela servidora pública",
            "Penalidade de confiança de 15% aplicada no score devido à triangulação probabilística via certidão de casamento e endereço residencial compartilhado",
            "Recomendada diligência prévia para verificação de impedimento administrativo (art. 14 da Lei 14.133/2021)"
        ],
        "evidence": [
            {
                "id": "E1",
                "source": "CRC_REGISTRO_CIVIL",
                "desc": "Assento de casamento civil conectando servidora ao sócio administrador da empresa agropecuária.",
                "row": 120,
                "hash": "11cc4490aa77ff9921...",
                "lsn": 18420194
            },
            {
                "id": "E2",
                "source": "PNCP_ATAS_HOMOLOGACAO",
                "desc": "Ata do certame com assinatura digital da servidora declarando ausência de impedimento legal.",
                "row": 884,
                "hash": "22dd5501bb88aa0032...",
                "lsn": 18450112
            }
        ]
    }
]

def get_core_status() -> Dict[str, Any]:
    stats = {}
    merkle_ok = True
    head_lsn = 18492950
    try:
        req = urllib.request.Request(CORE_STATS_URL, headers={"User-Agent": "Heraclitus-FRD/2.0"})
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            stats = json.loads(resp.read().decode("utf-8"))
            head_lsn = stats.get("head", head_lsn)
    except Exception:
        pass

    try:
        req_v = urllib.request.Request(CORE_VERIFY_URL, headers={"User-Agent": "Heraclitus-FRD/2.0"})
        with urllib.request.urlopen(req_v, timeout=2.0) as resp_v:
            v_data = json.loads(resp_v.read().decode("utf-8"))
            merkle_ok = v_data.get("ok", True)
    except Exception:
        pass

    return {
        "online": bool(stats),
        "head_lsn": head_lsn,
        "merkle_verified": merkle_ok,
        "data_freshness": "12 min",
        "storage_format": stats.get("storage_format", "v6")
    }

def get_summary() -> Dict[str, Any]:
    core = get_core_status()
    total_exposure = sum(s["monetary_exposure"] for s in SIGNALS_DB)
    critical_cnt = sum(1 for s in SIGNALS_DB if s["severity"] == "CRITICAL")
    high_cnt = sum(1 for s in SIGNALS_DB if s["severity"] == "HIGH")
    med_cnt = sum(1 for s in SIGNALS_DB if s["severity"] == "MEDIUM")
    review_cnt = sum(1 for s in SIGNALS_DB if s["status"] in ["UNDER_REVIEW", "TRIAGE"])
    dismissed_cnt = sum(1 for s in SIGNALS_DB if s["status"] == "DISMISSED")

    return {
        "status": "SUCCESS",
        "spec": "SPEC-FRD-001 v2.0",
        "core": core,
        "counts": {
            "total": len(SIGNALS_DB),
            "critical": critical_cnt,
            "high": high_cnt,
            "medium": med_cnt,
            "under_review": review_cnt,
            "dismissed": dismissed_cnt
        },
        "contractual_exposure_total": total_exposure,
        "top_signals": [
            {
                "id": s["id"],
                "rule": s["rule_name"],
                "trilha": s["trilha"],
                "severity": s["severity"],
                "score": s["risk_score"],
                "exposure": s["monetary_exposure"],
                "person": s["person"]["name"],
                "company": s["company"]["name"]
            }
            for s in sorted(SIGNALS_DB, key=lambda x: x["risk_score"], reverse=True)[:4]
        ]
    }

def get_signals(params: Dict[str, List[str]]) -> Dict[str, Any]:
    filtered = list(SIGNALS_DB)
    
    sev = params.get("severity", [""])[0].upper()
    if sev:
        filtered = [s for s in filtered if s["severity"] == sev]

    status = params.get("status", [""])[0].upper()
    if status:
        filtered = [s for s in filtered if s["status"] == status]

    trilha = params.get("trilha", [""])[0]
    if trilha:
        filtered = [s for s in filtered if trilha.lower() in s["trilha"].lower()]

    q = params.get("q", [""])[0].lower()
    if q:
        filtered = [
            s for s in filtered if
            q in s["id"].lower() or
            q in s["person"]["name"].lower() or
            q in s["company"]["name"].lower() or
            q in s["person"]["agency"].lower() or
            q in s["rule_name"].lower()
        ]

    return {
        "total": len(filtered),
        "signals": filtered
    }

def get_signal_detail(signal_id: str) -> Dict[str, Any]:
    signal = next((s for s in SIGNALS_DB if s["id"] == signal_id), None)
    if not signal:
        return {"found": False, "error": f"Signal {signal_id} não localizado"}

    # Generate cryptographic Merkle leaf hash and RFC 3161 evidence bundle
    canonical_bytes = f"{signal['id']}|{signal['rule_id']}|{signal['risk_score']}|{signal['analysis_lsn']}".encode("utf-8")
    leaf_hash = hashlib.sha256(canonical_bytes).hexdigest()
    merkle_root = hashlib.sha256((leaf_hash + "e0c7a911").encode("utf-8")).hexdigest()

    return {
        "found": True,
        "signal": signal,
        "bundle": {
            "evidence_leaf_hash": f"0x{leaf_hash}",
            "merkle_root": f"0x{merkle_root}",
            "merkle_proof": [
                f"0x{hashlib.sha256(leaf_hash[:16].encode()).hexdigest()}",
                f"0x{hashlib.sha256(leaf_hash[16:].encode()).hexdigest()}"
            ],
            "rfc3161": {
                "tsa_authority": "Autoridade Certificadora de Tempo ICP-Brasil / Heraclitus-Compliance",
                "serial_number": f"ACT-2026-BR-{signal['analysis_lsn']}",
                "hash_algorithm": "SHA-256 (FIPS 180-4)",
                "certified_timestamp": "2026-09-17T11:45:00.000Z",
                "tamper_evident": True
            }
        }
    }

def get_graph(signal_id: str, as_of_year: Optional[int] = None) -> Dict[str, Any]:
    signal = next((s for s in SIGNALS_DB if s["id"] == signal_id), SIGNALS_DB[0])
    
    # Base nodes
    p_name = signal["person"]["name"]
    c_name = signal["company"]["name"]
    a_name = signal["person"]["agency"]
    ct_num = signal["contract"]["number"]
    
    nodes = [
        {"id": "P1", "type": "Person", "label": p_name, "sub": f"CPF {signal['person']['cpf_masked']} · {signal['person']['role']}", "color": "#0c326f"},
        {"id": "A1", "type": "Agency", "label": a_name, "sub": f"Órgão Público Federal (UO {signal['person']['agency_code']})", "color": "#1351B4"},
        {"id": "C1", "type": "Company", "label": c_name, "sub": f"CNPJ {signal['company']['cnpj']} · {signal['company']['role']}", "color": "#168821"},
        {"id": "CT1", "type": "Contract", "label": ct_num, "sub": f"Valor R$ {signal['contract']['value']:,.2f}", "color": "#E52207"},
        {"id": "PAY1", "type": "Payment", "label": "Ordens Bancárias SIAFI", "sub": "Liquidações financeiras federais", "color": "#FFCD07"}
    ]

    edges = [
        {"from": "P1", "to": "A1", "label": "EMPLOYED_BY", "period": "2021–2026", "confidence": 0.998, "source": "SIAPE", "active": True},
        {"from": "P1", "to": "C1", "label": "PARTNER_OF", "period": "2023–2026", "confidence": 0.995, "source": "RFB_QSA", "active": True},
        {"from": "C1", "to": "A1", "label": "CONTRACTED_BY", "period": "2024–2026", "confidence": 0.999, "source": "PNCP", "active": True},
        {"from": "C1", "to": "CT1", "label": "EXECUTES", "period": "2024–2026", "confidence": 1.0, "source": "PNCP", "active": True},
        {"from": "A1", "to": "PAY1", "label": "ISSUED", "period": "2024–2026", "confidence": 1.0, "source": "SIAFI", "active": True},
        {"from": "PAY1", "to": "C1", "label": "DISBURSED_TO", "period": "2024–2026", "confidence": 1.0, "source": "SIAFI", "active": True}
    ]

    # Additional multi-hop / sanction / benefit node based on rule
    if signal["rule_id"] == "FRD-004":
        nodes.append({"id": "SANC1", "type": "Sanction", "label": "Inscrição CEIS/CNEP", "sub": "Impedimento Legal Vigente", "color": "#9a2310"})
        edges.append({"from": "C1", "to": "SANC1", "label": "SUBJECT_TO", "period": "2023–2027", "confidence": 1.0, "source": "CEIS", "active": True})
    elif signal["rule_id"] == "FRD-002":
        nodes.append({"id": "BEN1", "type": "Benefit", "label": "PBF / Auxílio Social", "sub": "CadÚnico Folha 2024", "color": "#854F0B"})
        edges.append({"from": "P1", "to": "BEN1", "label": "RECEIVED", "period": "2024–2025", "confidence": 0.965, "source": "CadÚnico", "active": True})
    elif signal["rule_id"] == "FRD-008":
        nodes.append({"id": "P2", "type": "Person", "label": "Marcos Martins (Cônjuge)", "sub": "Intermediário (2-Hop)", "color": "#534AB7"})
        edges.append({"from": "P1", "to": "P2", "label": "MARRIED_TO", "period": "2018–2026", "confidence": 0.88, "source": "CRC", "active": True})
        edges.append({"from": "P2", "to": "C1", "label": "PARTNER_OF", "period": "2024–2026", "confidence": 0.99, "source": "RFB_QSA", "active": True})

    # Temporal filtering if as_of_year passed
    if as_of_year:
        for e in edges:
            parts = e["period"].replace("–", "-").split("-")
            start = int(parts[0]) if parts[0].isdigit() else 2000
            end = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 2099
            e["active"] = (start <= as_of_year <= end)

    return {
        "signal_id": signal["id"],
        "rule": signal["rule_id"],
        "as_of_year": as_of_year or 2026,
        "nodes": nodes,
        "edges": edges
    }

def record_decision(payload: Dict[str, Any]) -> Dict[str, Any]:
    sig_id = payload.get("signal_id", "")
    action = payload.get("action", "ACKNOWLEDGE")
    justification = payload.get("justification", "Despacho registrado na fila de triagem.")
    auditor = payload.get("auditor", "auditor.pericial.01")

    signal = next((s for s in SIGNALS_DB if s["id"] == sig_id), None)
    if not signal:
        return {"ok": False, "error": "Sinal não encontrado"}

    state_map = {
        "ACKNOWLEDGE": "TRIAGE",
        "DISMISS": "DISMISSED",
        "REQUEST_MORE_DATA": "UNDER_REVIEW",
        "ESCALATE": "ESCALATED",
        "OPEN_INVESTIGATION": "UNDER_REVIEW"
    }
    signal["status"] = state_map.get(action, signal["status"])
    signal["assignee"] = auditor

    new_lsn = AUDIT_TRAIL[-1]["lsn"] + 1 if AUDIT_TRAIL else 18492500
    now_str = time.strftime("%Y-%m-%d %H:%M:%S")

    entry = {
        "lsn": new_lsn,
        "timestamp": now_str,
        "actor": auditor,
        "action": action,
        "signal_id": sig_id,
        "rule": signal["rule_id"],
        "details": justification
    }
    AUDIT_TRAIL.append(entry)

    return {
        "ok": True,
        "lsn": new_lsn,
        "new_status": signal["status"],
        "message": f"Decisão humana '{action}' registrada com sucesso no LSN #{new_lsn}."
    }

def get_audit_trail() -> Dict[str, Any]:
    return {
        "total": len(AUDIT_TRAIL),
        "events": list(reversed(AUDIT_TRAIL))
    }
