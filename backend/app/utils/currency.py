"""Formatação de moeda brasileira."""


def fmt_brl(value: float) -> str:
    """Ex: 1234.5 → 'R$ 1.234,50'"""
    return f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def parse_brl(text: str) -> float:
    """
    Extrai valor numérico de strings como 'R$ 1.234,50' ou '1234,50'.
    Retorna 0.0 se não conseguir parsear.
    """
    import re
    cleaned = re.sub(r"[R$\s.]", "", text).replace(",", ".")
    try:
        return float(cleaned)
    except ValueError:
        return 0.0
