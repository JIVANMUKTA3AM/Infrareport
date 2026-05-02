/**
 * Hook que busca dados reais do dashboard via API.
 * Substitui o mock.js com dados da conta do usuário autenticado.
 */
import { useState, useEffect, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || ''

// Paleta de cores para categorias dinâmicas
const CATEGORY_COLORS = ['#EF4444','#8B5CF6','#F97316','#EC4899','#F59E0B','#64748B']

export function useDashboardData(userId, month, year) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetch_ = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)

    try {
      const qs = new URLSearchParams({ user_id: userId })
      if (month) qs.set('month', month)
      if (year)  qs.set('year',  year)

      const res = await fetch(`${API_BASE}/api/dashboard/stats?${qs}`)
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      const raw = await res.json()

      // Normaliza monthly com acumulado
      const monthly = (raw.monthly || []).reduce((acc, row, i) => {
        const prev = acc[i - 1]?.acumulado ?? 0
        acc.push({ ...row, acumulado: prev + (row.entradas - row.saidas) })
        return acc
      }, [])

      // Normaliza categorias de saída para o PieChart
      const categories = (raw.categories || []).map((c, i) => ({
        name:  c.category || 'Outros',
        value: Number(c.total),
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      }))

      setData({ ...raw, monthly, categories })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId, month, year])

  useEffect(() => { fetch_() }, [fetch_])

  return { data, loading, error, refetch: fetch_ }
}
