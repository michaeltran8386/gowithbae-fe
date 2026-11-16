import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react'
import { readJson, writeJson } from '../lib/storage.ts'

export const MAX_COMPARE = 3
const KEY = 'gwb.compare'

type CompareContextValue = {
  state: { ids: string[] }
  actions: { add: (id: string) => boolean; remove: (id: string) => void; toggle: (id: string) => boolean; clear: () => void }
  meta: { isFull: boolean; has: (id: string) => boolean }
}

const CompareContext = createContext<CompareContextValue | null>(null)

/** Khay so sánh tối đa 3 nơi, lưu trên thiết bị (A-09, RULE-06). */
export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(() => readJson<string[]>(KEY, []).slice(0, MAX_COMPARE))

  const commit = useCallback((next: string[]) => {
    setIds(next)
    writeJson(KEY, next)
  }, [])

  const value = useMemo<CompareContextValue>(() => {
    const add = (id: string) => {
      if (ids.includes(id)) return true
      if (ids.length >= MAX_COMPARE) return false
      commit([...ids, id])
      return true
    }
    const remove = (id: string) => commit(ids.filter((x) => x !== id))
    return {
      state: { ids },
      actions: {
        add,
        remove,
        toggle: (id) => (ids.includes(id) ? (remove(id), true) : add(id)),
        clear: () => commit([]),
      },
      meta: { isFull: ids.length >= MAX_COMPARE, has: (id) => ids.includes(id) },
    }
  }, [ids, commit])

  return <CompareContext value={value}>{children}</CompareContext>
}

export function useCompare() {
  const ctx = use(CompareContext)
  if (!ctx) throw new Error('useCompare phải nằm trong CompareProvider')
  return ctx
}
