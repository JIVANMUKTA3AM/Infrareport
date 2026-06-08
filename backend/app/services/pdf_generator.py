"""
Gera proposta comercial profissional em PDF usando ReportLab Platypus.
"""
from datetime import date
from pathlib import Path
from typing import Optional
from uuid import UUID

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether,
)

from app.config import get_settings
from app.models.proposal import ProposalRequest, ProposalContent

# ── Paleta ─────────────────────────────────────────────────
C_BLUE_DARK  = HexColor("#1E3A8A")
C_BLUE_MID   = HexColor("#1D4ED8")
C_BLUE_LIGHT = HexColor("#DBEAFE")
C_GRAY_TEXT  = HexColor("#374151")
C_GRAY_MID   = HexColor("#94A3B8")
C_GRAY_LIGHT = HexColor("#F1F5F9")
C_GRAY_LINE  = HexColor("#CBD5E1")
C_WHITE      = white

PAGE_W, PAGE_H = A4
MARGIN   = 2.2 * cm
INNER_W  = PAGE_W - 2 * MARGIN


def _curr(v: float) -> str:
    return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def _s(name: str, **kw) -> ParagraphStyle:
    base = dict(fontName="Helvetica", fontSize=10, leading=14, textColor=C_GRAY_TEXT)
    base.update(kw)
    return ParagraphStyle(name, **base)


STYLES = {
    "title": _s("title", fontName="Helvetica-Bold", fontSize=22, textColor=C_BLUE_DARK,
                alignment=TA_CENTER, leading=28, spaceAfter=4),
    "subtitle": _s("subtitle", fontName="Helvetica-Bold", fontSize=11, textColor=C_BLUE_MID,
                   alignment=TA_CENTER, leading=16, spaceAfter=4),
    "section": _s("section", fontName="Helvetica-Bold", fontSize=10, textColor=C_BLUE_DARK,
                  leading=14, spaceBefore=14, spaceAfter=4),
    "body": _s("body", fontSize=9.5, leading=14, alignment=TA_JUSTIFY, spaceAfter=4),
    "body_label": _s("body_label", fontName="Helvetica-Bold", fontSize=9, textColor=C_BLUE_DARK, leading=13),
    "meta_label": _s("meta_label", fontName="Helvetica-Bold", fontSize=8, textColor=C_BLUE_MID, leading=10),
    "meta_value": _s("meta_value", fontSize=9, textColor=C_GRAY_TEXT, leading=13),
    "th": _s("th", fontName="Helvetica-Bold", fontSize=8.5, textColor=C_WHITE, alignment=TA_CENTER, leading=12),
    "td": _s("td", fontSize=9, textColor=C_GRAY_TEXT, leading=12),
    "td_center": _s("td_center", fontSize=9, textColor=C_GRAY_TEXT, alignment=TA_CENTER, leading=12),
    "td_right": _s("td_right", fontSize=9, textColor=C_GRAY_TEXT, alignment=TA_RIGHT, leading=12),
    "total_label": _s("total_label", fontName="Helvetica-Bold", fontSize=9.5, textColor=C_WHITE, alignment=TA_RIGHT, leading=13),
    "total_value": _s("total_value", fontName="Helvetica-Bold", fontSize=10.5, textColor=C_WHITE, alignment=TA_RIGHT, leading=13),
    "sign": _s("sign", fontSize=8.5, textColor=C_GRAY_TEXT, alignment=TA_CENTER, leading=14),
}


def _p(text: str, style: str) -> Paragraph:
    return Paragraph(text or "&nbsp;", STYLES[style])


def _section(text: str) -> list:
    return [
        _p(text.upper(), "section"),
        HRFlowable(width="100%", thickness=1.5, color=C_BLUE_DARK, spaceAfter=6),
    ]


def _info_table(rows: list[tuple[str, str]]) -> Table:
    col_w = [3.8 * cm, INNER_W - 3.8 * cm]
    data = [[_p(label, "body_label"), _p(value, "meta_value")] for label, value in rows]
    t = Table(data, colWidths=col_w)
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (0, -1), C_BLUE_LIGHT),
        ("BACKGROUND",    (1, 0), (1, -1), C_GRAY_LIGHT),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
        ("GRID",          (0, 0), (-1, -1), 0.3, C_GRAY_LINE),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return t


def _items_table(equipments, total: float) -> Table:
    header = [
        _p("DESCRIÇÃO",  "th"),
        _p("QTD",        "th"),
        _p("UNIT.",      "th"),
        _p("SUBTOTAL",   "th"),
    ]
    rows = [header]
    for i, eq in enumerate(equipments):
        sub = eq.quantity * eq.unit_price
        bg = C_WHITE if i % 2 == 0 else C_GRAY_LIGHT
        rows.append([
            _p(eq.description,    "td"),
            _p(str(eq.quantity),  "td_center"),
            _p(_curr(eq.unit_price), "td_right"),
            _p(_curr(sub),           "td_right"),
        ])

    # Linha de total
    rows.append([
        _p("VALOR TOTAL DA PROPOSTA", "total_label"),
        "", "", _p(_curr(total), "total_value"),
    ])

    col_w = [INNER_W * 0.48, INNER_W * 0.10, INNER_W * 0.20, INNER_W * 0.22]
    n = len(equipments)
    t = Table(rows, colWidths=col_w, repeatRows=1)

    style_cmds = [
        # Cabeçalho
        ("BACKGROUND",    (0, 0),      (-1, 0),      C_BLUE_DARK),
        ("TOPPADDING",    (0, 0),      (-1, 0),      7),
        ("BOTTOMPADDING", (0, 0),      (-1, 0),      7),
        # Dados
        ("TOPPADDING",    (0, 1),      (-1, n),      5),
        ("BOTTOMPADDING", (0, 1),      (-1, n),      5),
        # Total
        ("BACKGROUND",    (0, n + 1),  (-1, n + 1),  C_BLUE_DARK),
        ("SPAN",          (0, n + 1),  (2, n + 1)),
        ("TOPPADDING",    (0, n + 1),  (-1, n + 1),  8),
        ("BOTTOMPADDING", (0, n + 1),  (-1, n + 1),  8),
        # Geral
        ("LEFTPADDING",   (0, 0),      (-1, -1),     8),
        ("RIGHTPADDING",  (0, 0),      (-1, -1),     8),
        ("GRID",          (0, 0),      (-1, n),      0.3, C_GRAY_LINE),
        ("VALIGN",        (0, 0),      (-1, -1),     "MIDDLE"),
    ]
    # Zebra nos dados
    for i in range(1, n + 1):
        bg = C_GRAY_LIGHT if i % 2 == 0 else C_WHITE
        style_cmds.append(("BACKGROUND", (0, i), (-1, i), bg))

    t.setStyle(TableStyle(style_cmds))
    return t


def _on_page(canvas, doc, company: str, validity_days: int):
    canvas.saveState()
    # Barra de cabeçalho
    canvas.setFillColor(C_BLUE_DARK)
    canvas.rect(0, PAGE_H - 1.0 * cm, PAGE_W, 1.0 * cm, fill=1, stroke=0)
    canvas.setFillColor(C_WHITE)
    canvas.setFont("Helvetica-Bold", 9)
    canvas.drawString(MARGIN, PAGE_H - 0.67 * cm, company)
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(PAGE_W - MARGIN, PAGE_H - 0.67 * cm, "PROPOSTA TÉCNICO-COMERCIAL")
    # Rodapé
    canvas.setFillColor(C_GRAY_MID)
    canvas.setFont("Helvetica", 7.5)
    canvas.drawCentredString(
        PAGE_W / 2, 0.7 * cm,
        f"{company}  ·  Proposta Técnico-Comercial  ·  "
        f"Emitida em {date.today().strftime('%d/%m/%Y')}  ·  "
        f"Válida por {validity_days} dias  ·  Pág. {doc.page}",
    )
    canvas.restoreState()


def generate_proposal_pdf(
    req: ProposalRequest,
    proposal_id: UUID,
    content: Optional[ProposalContent] = None,
) -> tuple[str, float]:
    cfg = get_settings()
    storage = Path(cfg.storage_path)
    storage.mkdir(parents=True, exist_ok=True)

    filename  = f"proposta_{proposal_id}.pdf"
    file_path = str(storage / filename)
    company   = req.company_name or "InfraReport"
    validity  = req.validity_days or 30
    total     = sum(e.quantity * e.unit_price for e in req.equipments)

    def on_page(canvas, doc):
        _on_page(canvas, doc, company, validity)

    doc = SimpleDocTemplate(
        file_path, pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=1.6 * cm, bottomMargin=1.6 * cm,
    )

    story = []

    # ── TÍTULO ────────────────────────────────────────────────
    story.append(Spacer(1, 0.3 * cm))
    story.append(_p(company, "title"))
    story.append(_p("PROPOSTA TÉCNICO-COMERCIAL", "subtitle"))
    story.append(Spacer(1, 0.3 * cm))

    # Meta tabela
    meta_rows = [
        [_p("N° PROPOSTA", "meta_label"), _p("EMISSÃO",          "meta_label"), _p("VALIDADE", "meta_label")],
        [_p(str(proposal_id)[:8].upper(), "meta_value"),
         _p(date.today().strftime("%d/%m/%Y"), "meta_value"),
         _p(f"{validity} dias", "meta_value")],
    ]
    meta_t = Table(meta_rows, colWidths=[INNER_W / 3] * 3)
    meta_t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0), C_BLUE_DARK),
        ("BACKGROUND",    (0, 1), (-1, 1), C_GRAY_LIGHT),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
        ("GRID",          (0, 0), (-1, -1), 0.3, C_GRAY_LINE),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(meta_t)
    story.append(Spacer(1, 0.5 * cm))

    # ── DADOS DO CLIENTE ──────────────────────────────────────
    story.extend(_section("Dados do Cliente"))
    story.append(_info_table([
        ("Cliente:", req.client_name),
        ("E-mail:",  req.client_email),
        ("Serviço:", req.service),
    ]))
    story.append(Spacer(1, 0.2 * cm))

    # ── APRESENTAÇÃO ─────────────────────────────────────────
    if content and content.introduction:
        story.extend(_section("Apresentação"))
        for line in content.introduction.split("\n"):
            if line.strip():
                story.append(_p(line.strip(), "body"))
        story.append(Spacer(1, 0.2 * cm))

    # ── ESCOPO ────────────────────────────────────────────────
    if content and content.scope:
        story.extend(_section("Escopo do Serviço"))
        for line in content.scope.split("\n"):
            if line.strip():
                story.append(_p(line.strip(), "body"))
        story.append(Spacer(1, 0.2 * cm))

    # ── METODOLOGIA ───────────────────────────────────────────
    if content and content.methodology:
        story.extend(_section("Metodologia e Execução"))
        for line in content.methodology.split("\n"):
            if line.strip():
                story.append(_p(line.strip(), "body"))
        story.append(Spacer(1, 0.2 * cm))

    # ── ITENS ─────────────────────────────────────────────────
    story.extend(_section("Itens da Proposta"))
    story.append(_items_table(req.equipments, total))
    story.append(Spacer(1, 0.4 * cm))

    # ── CONDIÇÕES COMERCIAIS ─────────────────────────────────
    if content and (content.payment_terms or content.execution_deadline or content.warranty):
        story.extend(_section("Condições Comerciais"))
        rows = []
        if content.execution_deadline:
            rows.append(("Prazo de Execução:",    content.execution_deadline))
        if content.payment_terms:
            rows.append(("Forma de Pagamento:",   content.payment_terms))
        if content.warranty:
            rows.append(("Garantia:",             content.warranty))
        rows.append(("Validade da Proposta:", f"{validity} dias corridos"))
        story.append(_info_table(rows))
        story.append(Spacer(1, 0.3 * cm))

    # ── DIFERENCIAIS ─────────────────────────────────────────
    if content and content.differentials:
        story.extend(_section("Nossos Diferenciais"))
        for line in content.differentials.split("\n"):
            if line.strip():
                story.append(_p(f"• {line.strip()}", "body"))
        story.append(Spacer(1, 0.3 * cm))

    # ── OBSERVAÇÕES ──────────────────────────────────────────
    notes = (content.notes if content else None) or req.notes
    if notes:
        story.extend(_section("Observações"))
        for line in notes.split("\n"):
            if line.strip():
                story.append(_p(line.strip(), "body"))
        story.append(Spacer(1, 0.3 * cm))

    # ── EMPRESA ───────────────────────────────────────────────
    story.extend(_section("Dados da Empresa"))
    emp_rows = [("Empresa:", company)]
    if req.company_phone:
        emp_rows.append(("Telefone:", req.company_phone))
    if req.company_email:
        emp_rows.append(("E-mail:", req.company_email))
    if req.company_address:
        emp_rows.append(("Endereço:", req.company_address))
    story.append(_info_table(emp_rows))
    story.append(Spacer(1, 1.2 * cm))

    # ── ACEITE ────────────────────────────────────────────────
    sign_style = ParagraphStyle("sign_local", fontName="Helvetica", fontSize=8.5,
                                textColor=C_GRAY_TEXT, alignment=TA_CENTER, leading=14)
    sign_data = [[
        Paragraph(f"______________________________<br/>{company}<br/>(Contratante)", sign_style),
        Paragraph(f"______________________________<br/>{req.client_name}<br/>(Contratado)", sign_style),
    ]]
    sign_t = Table(sign_data, colWidths=[INNER_W / 2, INNER_W / 2])
    sign_t.setStyle(TableStyle([
        ("ALIGN",      (0, 0), (-1, -1), "CENTER"),
        ("VALIGN",     (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 24),
    ]))
    story.append(KeepTogether([sign_t]))

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    return file_path, total
