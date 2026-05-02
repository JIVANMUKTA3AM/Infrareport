"""
Gera proposta comercial em .docx usando python-docx.
Salva o arquivo em STORAGE_PATH e retorna o caminho.
"""
import os
from datetime import date
from pathlib import Path
from uuid import UUID

from docx import Document
from docx.shared import Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH

from app.config import get_settings
from app.models.proposal import ProposalRequest


def _currency(value: float) -> str:
    return f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def generate_proposal_docx(req: ProposalRequest, proposal_id: UUID) -> tuple[str, float]:
    """
    Retorna (file_path, total_value).
    """
    cfg = get_settings()
    storage = Path(cfg.storage_path)
    storage.mkdir(parents=True, exist_ok=True)

    doc = Document()

    # ── Margens ────────────────────────────────
    for section in doc.sections:
        section.top_margin    = Cm(2)
        section.bottom_margin = Cm(2)
        section.left_margin   = Cm(2.5)
        section.right_margin  = Cm(2.5)

    # ── Cabeçalho ──────────────────────────────
    h = doc.add_heading("InfraReport", level=1)
    h.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = h.runs[0]
    run.font.color.rgb = RGBColor(0x1E, 0x40, 0xAF)

    sub = doc.add_paragraph("Proposta Comercial")
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub.runs[0].font.size = Pt(13)
    sub.runs[0].font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    doc.add_paragraph()

    # ── Dados do cliente ───────────────────────
    doc.add_heading("Dados do Cliente", level=2)
    table_info = doc.add_table(rows=3, cols=2)
    table_info.style = "Table Grid"
    data_info = [
        ("Cliente",  req.client_name),
        ("E-mail",   req.client_email),
        ("Serviço",  req.service),
    ]
    for i, (label, value) in enumerate(data_info):
        table_info.cell(i, 0).text = label
        table_info.cell(i, 1).text = value

    doc.add_paragraph()

    # ── Tabela de itens ────────────────────────
    doc.add_heading("Itens da Proposta", level=2)
    cols = ["Descrição", "Qtd", "Valor Unit.", "Subtotal"]
    table = doc.add_table(rows=1 + len(req.equipments), cols=4)
    table.style = "Table Grid"

    # cabeçalho
    header = table.rows[0].cells
    for i, col in enumerate(cols):
        header[i].text = col
        header[i].paragraphs[0].runs[0].bold = True

    total = 0.0
    for i, eq in enumerate(req.equipments, start=1):
        subtotal = eq.quantity * eq.unit_price
        total += subtotal
        row = table.rows[i].cells
        row[0].text = eq.description
        row[1].text = str(eq.quantity)
        row[2].text = _currency(eq.unit_price)
        row[3].text = _currency(subtotal)

    doc.add_paragraph()

    # ── Total ──────────────────────────────────
    p_total = doc.add_paragraph()
    p_total.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run_total = p_total.add_run(f"TOTAL: {_currency(total)}")
    run_total.bold = True
    run_total.font.size = Pt(14)
    run_total.font.color.rgb = RGBColor(0x1E, 0x40, 0xAF)

    # ── Observações ────────────────────────────
    if req.notes:
        doc.add_heading("Observações", level=2)
        doc.add_paragraph(req.notes)

    # ── Rodapé ─────────────────────────────────
    doc.add_paragraph()
    footer = doc.add_paragraph(f"Data: {date.today().strftime('%d/%m/%Y')}")
    footer.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    footer.runs[0].font.size = Pt(9)
    footer.runs[0].font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)

    # ── Salvar ─────────────────────────────────
    filename = f"proposta_{proposal_id}.docx"
    file_path = str(storage / filename)
    doc.save(file_path)

    return file_path, total
