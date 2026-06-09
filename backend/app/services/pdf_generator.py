"""
Gera proposta comercial em PDF via Gotenberg (Chrome headless).
O template HTML é renderizado com Jinja2 e enviado ao Gotenberg,
que devolve o PDF pronto.
"""
from datetime import date
from pathlib import Path
from typing import Optional
from uuid import UUID

import httpx
from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.config import get_settings
from app.models.proposal import ProposalRequest, ProposalContent

# Carrega templates do diretório app/templates/
_TEMPLATES_DIR = Path(__file__).parent.parent / "templates"
_jinja_env = Environment(
    loader=FileSystemLoader(str(_TEMPLATES_DIR)),
    autoescape=select_autoescape(["html"]),
)

SEGMENT_LABELS = {
    "ac":        "Climatização / Ar-Condicionado",
    "cftv":      "CFTV / Segurança Eletrônica",
    "ti":        "TI / Redes e Infraestrutura",
    "eletrica":  "Instalações Elétricas",
    "hidraulica": "Instalações Hidráulicas",
    "alarme":    "Alarme e Monitoramento",
    "automacao": "Automação Predial",
    "telecom":   "Telecomunicações",
}


def _currency(value: float) -> str:
    """Formata float como R$ 1.234,56"""
    return f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def _build_html(
    req: ProposalRequest,
    proposal_id: UUID,
    content: Optional[ProposalContent],
) -> str:
    """Renderiza o template Jinja2 com os dados da proposta."""
    total = sum(e.quantity * e.unit_price for e in req.equipments)

    _jinja_env.filters["currency"] = lambda v: _currency(float(v))

    template = _jinja_env.get_template("proposal.html")
    return template.render(
        company=req.company_name or "InfraReport",
        company_phone=req.company_phone or "",
        company_email=req.company_email or "",
        company_address=req.company_address or "",
        logo_base64=req.logo_base64 or "",
        client_name=req.client_name,
        client_email=req.client_email,
        service=req.service,
        segment_label=SEGMENT_LABELS.get(req.segment, req.segment.title()),
        proposal_number=str(proposal_id)[:8].upper(),
        emission_date=date.today().strftime("%d/%m/%Y"),
        validity_days=req.validity_days or 30,
        equipments=req.equipments,
        total_formatted=_currency(total),
        content=content,
        notes=(content.notes if content else None) or req.notes or "",
    )


def generate_proposal_pdf(
    req: ProposalRequest,
    proposal_id: UUID,
    content: Optional[ProposalContent] = None,
) -> tuple[str, float]:
    """
    Gera PDF via Gotenberg e salva em disco.
    Retorna (caminho_do_arquivo, valor_total).
    """
    cfg = get_settings()
    storage = Path(cfg.storage_path)
    storage.mkdir(parents=True, exist_ok=True)

    html = _build_html(req, proposal_id, content)
    total = sum(e.quantity * e.unit_price for e in req.equipments)

    # Envia ao Gotenberg
    response = httpx.post(
        f"{cfg.gotenberg_url}/forms/chromium/convert/html",
        files={"index.html": ("index.html", html.encode("utf-8"), "text/html")},
        data={
            "paperWidth":    "21.0",
            "paperHeight":   "29.7",
            "marginTop":     "0",
            "marginBottom":  "0",
            "marginLeft":    "0",
            "marginRight":   "0",
            "printBackground": "true",
            "scale":         "1.0",
        },
        timeout=60.0,
    )
    response.raise_for_status()

    filename  = f"proposta_{proposal_id}.pdf"
    file_path = str(storage / filename)
    Path(file_path).write_bytes(response.content)

    return file_path, total
