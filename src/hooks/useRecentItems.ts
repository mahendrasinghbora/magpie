import { useState, useEffect, useCallback } from 'react'

const MAX_RECENT_ITEMS = 5

export function useRecentItems(key: string) {
  const storageKey = `magpie_recent_${key}`

  const [recentIds, setRecentIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(recentIds))
    } catch {
      // Ignore storage errors
    }
  }, [recentIds, storageKey])

  const addRecent = useCallback((id: string) => {
    setRecentIds((prev) => {
      // Remove if already exists, then add to front
      const filtered = prev.filter((i) => i !== id)
      return [id, ...filtered].slice(0, MAX_RECENT_ITEMS)
    })
  }, [])

  return { recentIds, addRecent }
}
