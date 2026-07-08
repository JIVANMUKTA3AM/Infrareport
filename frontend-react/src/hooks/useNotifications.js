import { useState, useEffect, useCallback } from 'react'

const API = ''

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState({ count: 0, items: [] })

  const refetch = useCallback(async () => {
    if (!userId) return
    try {
      const r = await fetch(`${API}/api/events/notifications?user_id=${userId}`)
      if (r.ok) setNotifications(await r.json())
    } catch {}
  }, [userId])

  useEffect(() => {
    refetch()
    const id = setInterval(refetch, 5 * 60 * 1000) // refresh every 5 min
    return () => clearInterval(id)
  }, [refetch])

  return { notifications, refetch }
}
