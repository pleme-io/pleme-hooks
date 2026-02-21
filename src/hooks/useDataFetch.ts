/**
 * Data Fetching Hook
 *
 * Generic data fetching with loading, error, and retry logic
 */

import { useMachine } from '@xstate/react'
import { useCallback, useEffect, useMemo } from 'react'
import {
  createDataFetchMachine,
  createPaginatedFetchMachine,
  getData,
  getError,
  isLoading,
} from '../machines/dataFetch.machine'

export interface FetchState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

export interface UseFetchOptions {
  autoFetch?: boolean
  retryCount?: number
  retryDelay?: number
  cacheTime?: number
}

/**
 * Generic data fetching hook with error handling and retry logic
 */
export function useDataFetch<T>(
  fetchFn: () => Promise<T>,
  deps: React.DependencyList = [],
  options: UseFetchOptions = {}
): FetchState<T> & {
  refetch: () => Promise<void>
  reset: () => void
} {
  const { autoFetch = true, retryCount = 0, retryDelay = 1000, cacheTime = 0 } = options

  const machine = useMemo(
    () => createDataFetchMachine(fetchFn, { retryCount, retryDelay, cacheTime }),
    [fetchFn, retryCount, retryDelay, cacheTime]
  )

  const [state, send] = useMachine(machine)

  const refetch = useCallback(async () => {
    send({ type: 'FETCH' })
  }, [send])

  const reset = useCallback(() => {
    send({ type: 'RESET' })
  }, [send])

  // Auto-fetch on mount and deps change
  useEffect(() => {
    if (autoFetch) {
      send({ type: 'FETCH' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // biome-ignore lint/correctness/useExhaustiveDependencies: deps is passed as a parameter
  }, deps)

  // Extract values from state machine
  const data = getData(state)
  const loading = isLoading(state)
  const error = getError(state)

  return {
    data,
    loading,
    error,
    refetch,
    reset,
  }
}

export interface UsePaginatedFetchReturn<T> {
  items: T[]
  loading: boolean
  error: Error | null
  hasMore: boolean
  loadMore: () => void
  refetch: () => void
  reset: () => void
  total: number
}

/**
 * Hook for paginated data fetching
 */
export function usePaginatedFetch<T>(
  fetchFn: (page: number, limit: number) => Promise<{ items: T[]; total: number }>,
  limit = 20
): UsePaginatedFetchReturn<T> {
  const machine = useMemo(() => createPaginatedFetchMachine(fetchFn, limit), [fetchFn, limit])

  const [state, send] = useMachine(machine)

  const loadMore = useCallback(() => {
    send({ type: 'LOAD_MORE' })
  }, [send])

  const refetch = useCallback(() => {
    send({ type: 'LOAD_PAGE', page: state.context.page })
  }, [send, state.context.page])

  const reset = useCallback(() => {
    send({ type: 'RESET' })
  }, [send])

  return {
    items: state.context.items,
    loading: state.context.loading,
    error: state.context.error,
    hasMore: state.context.hasMore,
    loadMore,
    refetch,
    reset,
    total: state.context.total,
  }
}
