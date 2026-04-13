import { useEffect, useMemo, useState } from 'react'
import { fetchEntries } from './entriesRepo'
import type { EntryDomainModel } from './types'
import { getReadableSupabaseError } from './errors'

export function useEntries() {
  const [entries, setEntries] = useState<EntryDomainModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadEntries = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetchEntries()
      setEntries(response)
    } catch (err) {
      setError(getReadableSupabaseError(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadEntries()
  }, [])

  return useMemo(
    () => ({
      entries,
      isLoading,
      error,
      reload: loadEntries,
    }),
    [entries, error, isLoading],
  )
}
