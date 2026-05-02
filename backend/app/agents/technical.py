"""
Agente Técnico InfraReport — assistente especializado em serviços técnicos de infraestrutura.

Cobre todos os nichos do SaaS:
  - Climatização / AC (split, VRF, chiller)
  - CFTV / Segurança Eletrônica
  - Infraestrutura de TI / Redes
  - Controle de Acesso
  - Instalações Elétricas
  - Alarme e Monitoramento
  - Automação Predial / BMS
  - Telecomunicações
  - Infraestrutura Civil / Laudos

Capacidades:
  - Responder dúvidas técnicas em linguagem natural
  - Gerar Laudos e Relatórios Técnicos estruturados
  - Recomendar normas ABNT / NR aplicáveis
  - Diagnóstico de falhas e troubleshooting
  - Sugerir dimensionamentos e boas práticas
  - Auxiliar na elaboração de OS e escopo de serviços
"""
import json
import anthropic
from app.config import get_settings
from app.models.technical import TechnicalChatRequest, TechnicalChatResponse

# ──────────────────────────────────────────────────────────────────────────────
# SYSTEM PROMPT — Abrangente para todos os nichos do SaaS
# ──────────────────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """Você é o **Agente Técnico da InfraReport**, um assistente especializado em serviços de infraestrutura técnica para prestadores de serviço (engenheiros, técnicos e integradores) no Brasil.

## IDENTIDADE E MISSÃO
Você atende profissionais técnicos que prestam serviços em:
- **Climatização / Ar-Condicionado**: splits, VRF/VRV, chiller, fan-coil, cortinas de ar, torres de resfriamento, sala-fria
- **CFTV e Segurança Eletrônica**: câmeras IP/analógica/HD-TVI, NVR/DVR, monitoramento remoto, cercas elétricas
- **Infraestrutura de TI e Redes**: cabeamento estruturado cat5e/cat6/cat6A/fibra óptica, switches, roteadores, APs Wi-Fi, servidores, storage, rack, NOC
- **Controle de Acesso**: catracas, torniquetes, leitores biométricos/RFID/facial, controle de ponto, interfones IP, porteiros eletrônicos
- **Instalações Elétricas**: quadros de distribuição (QDC/QGBT), dimensionamento de circuitos, SPDA/para-raios, laudos NR10, nobreaks, geradores
- **Alarme e Monitoramento**: sensores PIR/infravermelho, centrais de alarme, sirenes, monitoramento 24h, sensores de fumaça/temperatura
- **Automação Predial / BMS**: sistemas KNX, DALI, protocolos BACnet/Modbus, integração de sistemas, automação de iluminação, HVAC inteligente
- **Telecomunicações**: PABX IP/analógico, ramais SIP/VoIP, fibra óptica, antenas, rádios, IPTV, cabeamento telefônico
- **Laudos e Vistorias Técnicas**: laudos de vistoria, relatórios de comissionamento, auto de conclusão, AVCB, laudos de acessibilidade

## NORMAS E REGULAMENTAÇÕES QUE VOCÊ DOMINA
- ABNT NBR 5410 (instalações elétricas de baixa tensão)
- ABNT NBR 5419 (SPDA)
- ABNT NBR 14565 (cabeamento estruturado)
- ABNT NBR 16401 (instalações de ar condicionado)
- ABNT NBR 9050 (acessibilidade)
- NR-10 (segurança em instalações elétricas)
- NR-12 (segurança em máquinas)
- NR-35 (trabalho em altura)
- Portaria INMETRO para equipamentos climatização
- LGPD — aplicada a sistemas de controle de acesso e CFTV
- ANATEL — homologação de equipamentos de telecomunicações
- Código de Obras Municipal (referências gerais)
- Manual de Obras Públicas (SEAP)

## CAPACIDADES

### 1. DÚVIDAS TÉCNICAS
Responda com precisão técnica, usando terminologia do setor. Inclua:
- Causa mais provável do problema
- Procedimento de diagnóstico passo a passo
- Solução recomendada
- Materiais/ferramentas necessários
- Norma aplicável (quando relevante)

### 2. GERAÇÃO DE RELATÓRIOS TÉCNICOS
Quando o usuário pedir relatório, laudo, vistoria ou OS, gere um documento estruturado com:
```
RELATÓRIO TÉCNICO — [TIPO]
════════════════════════════════════════
Empresa: [nome se fornecido]
Responsável Técnico: [nome se fornecido]
Data: [data atual]
Obra/Local: [local se fornecido]
────────────────────────────────────────
1. OBJETO
[descrição do serviço]

2. ESCOPO DOS SERVIÇOS
[lista detalhada]

3. CONSTATAÇÕES TÉCNICAS
[observações]

4. RECOMENDAÇÕES
[melhorias e ações corretivas]

5. NORMAS APLICADAS
[lista das normas]

6. CONCLUSÃO
[parecer técnico]

Responsável Técnico: ___________________
CREA/CAU nº: __________________________
```

### 3. DIMENSIONAMENTO
Faça cálculos quando solicitado:
- Carga térmica (BTU/h): use 600 BTU/h por m² como referência básica, ajuste por exposição solar, ocupação e equipamentos
- Circuitos elétricos: Corrente = Potência / (Tensão × FP × rendimento)
- Quantidade de câmeras: área ÷ ângulo de cobertura
- Pontos de rede: por área e tipo de uso

### 4. TROUBLESHOOTING / DIAGNÓSTICO
Para falhas, siga a lógica:
1. Sintoma → causas prováveis (da mais comum à menos comum)
2. Teste rápido para confirmar
3. Solução definitiva
4. Prevenção futura

### 5. ORDENS DE SERVIÇO
Gere OS estruturadas com: dados do cliente, descrição do serviço, materiais, mão de obra, prazo estimado, observações.

## ESTILO DE RESPOSTA
- Use linguagem técnica mas acessível
- Organize em tópicos e listas quando possível
- Destaque informações críticas de segurança com ⚠️
- Use emojis técnicos para facilitar leitura: 🔧 🔌 📡 🖥️ 🌡️ 📷 🔐
- Seja objetivo e prático — o técnico está no campo
- Para relatórios, use formatação estruturada com separadores

## DETECÇÃO DE NICHO
Ao identificar o nicho do usuário pela conversa, adapte sua linguagem e referências ao segmento. Se o nicho não estiver claro, pergunte ou infira pelo contexto.

## LIMITES
- Não invente especificações de equipamentos — sugira que o usuário verifique datasheet
- Para questões legais ou de responsabilidade civil, recomende consulta a advogado
- Em situações de risco elétrico, SEMPRE recomende desligar o disjuntor antes de qualquer intervenção
"""

# Mapeamento de nichos para label
NICHE_LABELS = {
    "ac":       "Climatização / AC",
    "cftv":     "CFTV / Segurança",
    "ti":       "TI / Redes",
    "acesso":   "Controle de Acesso",
    "eletrica": "Instalações Elétricas",
    "alarme":   "Alarme / Monitoramento",
    "automacao":"Automação Predial",
    "telecom":  "Telecomunicações",
    "laudo":    "Laudos / Vistorias",
}

# Palavras-chave por nicho para detecção automática
NICHE_KEYWORDS = {
    "ac":       ["ar condicionado", "split", "vrf", "vrv", "chiller", "btu", "condensadora", "evaporadora", "freon", "gás refrigerante", "climatização", "hvac"],
    "cftv":     ["câmera", "cftv", "nvr", "dvr", "gravador", "lente", "monitoramento", "vigilância", "ccd", "ip cam", "segurança eletrônica"],
    "ti":       ["rede", "switch", "roteador", "cabeamento", "cat6", "fibra", "wi-fi", "wifi", "servidor", "rack", "patch", "vlan", "ip", "dhcp", "ti"],
    "acesso":   ["catraca", "controle de acesso", "biométrico", "rfid", "portão", "interfone", "leitor", "cancela", "balança", "ponto eletrônico"],
    "eletrica": ["quadro", "disjuntor", "aterramento", "spda", "para-raios", "nr10", "circuito", "fio", "cabo elétrico", "tomada", "tensão", "corrente"],
    "alarme":   ["alarme", "sensor", "pir", "sirene", "central de alarme", "monitoramento", "detectores", "fumaca", "fumaça", "incêndio"],
    "automacao":["automação", "bms", "knx", "bacnet", "modbus", "plc", "iot", "smart", "dali", "iluminação automatizada"],
    "telecom":  ["pabx", "ramal", "voip", "sip", "telefonia", "fibra óptica", "antena", "rádio", "frequência"],
    "laudo":    ["laudo", "vistoria", "relatório", "avcb", "habite-se", "comissionamento", "entrega de obra"],
}


def detect_niche(text: str, current_niche: str | None) -> str | None:
    """Detecta o nicho pelo texto da mensagem."""
    if current_niche:
        return current_niche
    text_lower = text.lower()
    for niche, keywords in NICHE_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            return niche
    return None


def detect_report_request(text: str) -> bool:
    """Verifica se a mensagem pede geração de relatório."""
    triggers = ["gerar relatório", "gera relatório", "relatório técnico", "laudo técnico",
                "faça um relatório", "elaborar laudo", "gerar laudo", "criar os",
                "ordem de serviço", "relatório de vistoria", "gere um relatório"]
    return any(t in text.lower() for t in triggers)


def build_suggestions(niche: str | None) -> list[str]:
    """Retorna sugestões de ações rápidas baseadas no nicho."""
    base = [
        "Gerar relatório técnico",
        "Preciso de um laudo",
        "Diagnóstico de falha",
    ]
    niche_tips = {
        "ac":       ["Calcular BTU para o ambiente", "Manutenção preventiva de split", "Erro de AC — diagnóstico"],
        "cftv":     ["Dimensionar câmeras para área", "Configurar acesso remoto NVR", "Câmera sem imagem — diagnóstico"],
        "ti":       ["Projetar rede estruturada", "VLAN e segmentação de rede", "Lentidão na rede — diagnóstico"],
        "acesso":   ["Configurar leitor biométrico", "Integrar catraca com sistema", "LGPD no controle de acesso"],
        "eletrica": ["Dimensionar circuito elétrico", "Checklist NR-10", "Instalação de SPDA"],
        "alarme":   ["Projetar sistema de alarme", "Sensor PIR não detecta — diagnóstico", "Central de alarme — programação"],
        "automacao":["Integrar sistemas BMS", "Protocolo KNX — configuração", "Automação de HVAC"],
        "telecom":  ["Configurar PABX IP", "Projeto de fibra óptica", "Ramal VoIP não registra"],
        "laudo":    ["Relatório de vistoria elétrica", "Laudo de entrega de obra", "Checklist de comissionamento"],
    }
    return (niche_tips.get(niche, base))[:3]


async def run_technical_agent(req: TechnicalChatRequest) -> TechnicalChatResponse:
    cfg = get_settings()

    # ── 1. Detecta nicho ──────────────────────────────────────
    niche = detect_niche(req.message, req.niche)

    # ── 2. Monta histórico de mensagens ───────────────────────
    messages = [
        {"role": m.role, "content": m.content}
        for m in req.history[-10:]  # limita a 10 mensagens para não estourar tokens
    ]
    messages.append({"role": "user", "content": req.message})

    # ── 3. Enriquece system prompt com nicho detectado ────────
    system = SYSTEM_PROMPT
    if niche:
        system += f"\n\n## NICHO ATUAL DA CONVERSA\nO usuário atua em: **{NICHE_LABELS.get(niche, niche)}**. Priorize exemplos, normas e terminologia deste segmento."

    # ── 4. Chama Claude ───────────────────────────────────────
    client = anthropic.Anthropic(api_key=cfg.anthropic_api_key)
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2048,
        system=system,
        messages=messages,
    )
    reply = response.content[0].text.strip()

    # ── 5. Detecta se contém relatório ────────────────────────
    has_report = detect_report_request(req.message) or "RELATÓRIO TÉCNICO" in reply.upper()

    # ── 6. Sugestões contextuais ──────────────────────────────
    suggestions = build_suggestions(niche)

    return TechnicalChatResponse(
        reply=reply,
        niche_detected=niche,
        has_report=has_report,
        suggestions=suggestions,
    )
