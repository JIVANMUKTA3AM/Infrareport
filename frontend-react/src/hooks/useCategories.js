import { useState, useEffect, useCallback } from 'react'

const API = 'https://api.infrareport.3amgflowz.com.br'

export function useCategories(userId, type = null) {
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)

  const refetch = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const p = new URLSearchParams({ user_id: userId })
      if (type) p.set('type', type)
      const r = await fetch(`${API}/api/categories?${p}`)
      if (r.ok) setCategories(await r.json())
    } catch {}
    finally { setLoading(false) }
  }, [userId, type])

  useEffect(() => { refetch() }, [refetch])

  return { categories, loading, refetch }
}
