"""
Gera relatório final de OS em PDF via Gotenberg (Chrome headless).
"""
import json
from datetime import date
from pathlib import Path

import httpx

from app.config import get_settings


def _fmt(v: float) -> str:
    return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def _row_bg(i: int) -> str:
    return "#F8FAFC" if i % 2 == 0 else "#FFFFFF"


async def generate_project_report(project: dict, financial_entries: list[dict]) -> str:
    cfg      = get_settings()
    proj_id  = project["id"]
    storage  = Path(cfg.storage_path)
    storage.mkdir(parents=True, exist_ok=True)
    out_path = str(storage / f"relatorio_{proj_id}.pdf")

    revenue    = float(project.get("revenue") or 0)
    mat_cost   = float(project.get("material_cost") or 0)
    lab_cost   = float(project.get("labor_cost") or 0)
    total_cost = mat_cost + lab_cost
    margin     = (revenue - total_cost) / revenue * 100 if revenue > 0 else 0.0
    resultado  = revenue - total_cost

    team = project.get("team") or []
    if isinstance(team, str):
        try:
            team = json.loads(team)
        except Exception:
            team = []

    entradas_total = sum(float(e.get("value", 0)) for e in financial_entries if e.get("type") == "entrada")
    saidas_total   = sum(float(e.get("value", 0)) for e in financial_entries if e.get("type") == "saida")

    entries_rows = ""
    for i, e in enumerate(financial_entries):
        tipo = "Entrada" if e.get("type") == "entrada" else "Saída"
        cor  = "#22C55E" if e.get("type") == "entrada" else "#EF4444"
        entries_rows += f"""
        <tr style="background:{_row_bg(i)}">
          <td style="padding:6px 12px">{e.get("date","")}</td>
          <td style="padding:6px 12px;color:{cor};font-weight:600">{tipo}</td>
          <td style="padding:6px 12px">{e.get("category","—")}</td>
          <td style="padding:6px 12px">{e.get("description","—")}</td>
          <td style="padding:6px 12px;text-align:right;font-weight:600">{_fmt(float(e.get("value",0)))}</td>
        </tr>"""

    team_section = ""
    if team:
        team_chips = "".join(
            f'<span style="display:inline-block;background:#EFF6FF;color:#1D4ED8;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:600;margin:3px">{t}</span>'
            for t in team
        )
        team_section = f"""
        <div class="section">
          <div class="section-title">Equipe Responsável</div>
          <div class="info-block">{team_chips}</div>
        </div>"""

    fin_section = ""
    if financial_entries:
        fin_section = f"""
        <div class="section">
          <div class="section-title">Lançamentos Financeiros</div>
          <table>
            <thead><tr>
              <th>Data</th><th>Tipo</th><th>Categoria</th><th>Descrição</th>
              <th style="text-align:right">Valor</th>
            </tr></thead>
            <tbody>{entries_rows}</tbody>
          </table>
        </div>"""

    scope_text = project.get("scope") or "Não informado."

    html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<style>
  *{{margin:0;padding:0;box-sizing:border-box;font-family:'Helvetica Neue',Arial,sans-serif}}
  body{{padding:40px;color:#1E293B;font-size:13px;line-height:1.5}}
  .header{{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;border-bottom:3px solid #1D4ED8;padding-bottom:18px}}
  .logo h1{{font-size:22px;font-weight:800;color:#1D4ED8}}
  .logo p{{color:#64748B;font-size:12px;margin-top:3px}}
  .badge{{background:#1D4ED8;color:#fff;padding:6px 18px;border-radius:6px;font-size:11px;font-weight:700;letter-spacing:1px;align-self:flex-start}}
  .section{{margin-bottom:22px}}
  .section-title{{font-size:11px;font-weight:700;color:#1D4ED8;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;padding-bottom:5px;border-bottom:1px solid #E2E8F0}}
  .grid-2{{display:grid;grid-template-columns:1fr 1fr;gap:10px}}
  .info-block{{background:#F8FAFC;border-radius:8px;padding:11px 14px}}
  .info-label{{font-size:10px;color:#94A3B8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}}
  .info-value{{font-size:13px;font-weight:600;color:#1E293B}}
  .kpi-row{{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px}}
  .kpi{{border-radius:10px;padding:14px;color:#fff}}
  .kpi label{{font-size:10px;opacity:.8;display:block;margin-bottom:3px;text-transform:uppercase;letter-spacing:.5px}}
  .kpi span{{font-size:18px;font-weight:800}}
  .kpi.blue{{background:linear-gradient(135deg,#1D4ED8,#2563EB)}}
  .kpi.red{{background:linear-gradient(135deg,#DC2626,#EF4444)}}
  .kpi.green{{background:linear-gradient(135deg,#059669,#10B981)}}
  .kpi.amber{{background:linear-gradient(135deg,#D97706,#F59E0B)}}
  table{{width:100%;border-collapse:collapse}}
  thead tr{{background:#1D4ED8;color:#fff}}
  thead th{{padding:7px 12px;text-align:left;font-size:11px;font-weight:600;letter-spacing:.5px}}
  .fin-summary{{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px}}
  .sig-area{{margin-top:44px;display:flex;gap:60px}}
  .sig-line{{border-top:1px solid #CBD5E1;width:200px;text-align:center;padding-top:7px;font-size:11px;color:#64748B}}
  .footer{{margin-top:32px;padding-top:14px;border-top:1px solid #E2E8F0;display:flex;justify-content:space-between;color:#94A3B8;font-size:11px}}
</style>
</head>
<body>

<div class="header">
  <div class="logo">
    <h1>InfraReport</h1>
    <p>Relatório de Encerramento de Ordem de Serviço</p>
  </div>
  <span class="badge">OS CONCLUÍDA</span>
</div>

<div class="section">
  <div class="section-title">Identificação do Projeto</div>
  <div class="grid-2">
    <div class="info-block"><div class="info-label">Projeto / OS</div><div class="info-value">{project.get("name","")}</div></div>
    <div class="info-block"><div class="info-label">Cliente</div><div class="info-value">{project.get("client","")}</div></div>
    <div class="info-block"><div class="info-label">Endereço</div><div class="info-value">{project.get("address") or "—"}</div></div>
    <div class="info-block"><div class="info-label">Segmento</div><div class="info-value">{(project.get("segment") or "—").upper()}</div></div>
    <div class="info-block"><div class="info-label">Data de Início</div><div class="info-value">{project.get("start_date") or "—"}</div></div>
    <div class="info-block"><div class="info-label">Data de Encerramento</div><div class="info-value">{date.today().strftime("%d/%m/%Y")}</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">Escopo do Serviço</div>
  <div class="info-block"><div class="info-value" style="font-weight:400">{scope_text}</div></div>
</div>

<div class="section">
  <div class="section-title">Resumo Financeiro</div>
  <div class="kpi-row">
    <div class="kpi blue"><label>Receita Contratada</label><span>{_fmt(revenue)}</span></div>
    <div class="kpi red"><label>Custo Total</label><span>{_fmt(total_cost)}</span></div>
    <div class="kpi green"><label>Margem Bruta</label><span>{margin:.1f}%</span></div>
    <div class="kpi amber"><label>Resultado</label><span>{_fmt(resultado)}</span></div>
  </div>
  <div class="grid-2">
    <div class="info-block"><div class="info-label">Custo de Materiais</div><div class="info-value">{_fmt(mat_cost)}</div></div>
    <div class="info-block"><div class="info-label">Mão de Obra</div><div class="info-value">{_fmt(lab_cost)}</div></div>
    <div class="info-block"><div class="info-label">Entradas Registradas</div><div class="info-value">{_fmt(entradas_total)}</div></div>
    <div class="info-block"><div class="info-label">Saídas Registradas</div><div class="info-value">{_fmt(saidas_total)}</div></div>
  </div>
</div>

{fin_section}
{team_section}

<div class="sig-area">
  <div class="sig-line">Responsável Técnico</div>
  <div class="sig-line">Cliente / Aprovação</div>
</div>

<div class="footer">
  <span>InfraReport — Gestão de Infraestrutura Predial</span>
  <span>Gerado automaticamente em {date.today().strftime("%d/%m/%Y")}</span>
</div>

</body>
</html>"""

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{cfg.gotenberg_url}/forms/chromium/convert/html",
            files={"files": ("index.html", html.encode("utf-8"), "text/html")},
        )
        resp.raise_for_status()

    with open(out_path, "wb") as f:
        f.write(resp.content)

    return out_path
