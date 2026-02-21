/**
 * Debounce and Throttle Hooks
 *
 * Performance optimization hooks for rate-limiting function calls using XState
 */

import { useMachine } from '@xstate/react'
import { useCallback, useEffect, useRef } from 'react'
import { createDebounceMachine, getDebouncedValue } from '../machines/debounce.machine'
import {
  createSearchMachine,
  getDebouncedQuery,
  getQuery,
  getResults,
  isSearching,
} from '../machines/search.machine'

/**
 * Hook that debounces a value using XState
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [state, send] = useMachine(createDebounceMachine(value, delay))

  useEffect(() => {
    send({ type: 'UPDATE_VALUE', value })
  }, [value, send])

  useEffect(() => {
    send({ type: 'SET_DELAY', delay })
  }, [delay, send])

  return getDebouncedValue(state)
}

/**
 * Hook that returns a debounced callback
 */
export function useDebouncedCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const callbackRef = useRef(callback)

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [delay, ...deps]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback as T
}

/**
 * Hook that returns a throttled callback
 */
export function useThrottledCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const lastRunRef = useRef(0)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const callbackRef = useRef(callback)

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      const timeSinceLastRun = now - lastRunRef.current

      if (timeSinceLastRun >= delay) {
        callbackRef.current(...args)
        lastRunRef.current = now
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
          callbackRef.current(...args)
          lastRunRef.current = Date.now()
        }, delay - timeSinceLastRun)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [delay, ...deps]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return throttledCallback as T
}

export interface UseDebouncedSearchReturn<T> {
  query: string
  setQuery: (query: string) => void
  results: T[]
  isSearching: boolean
  debouncedQuery: string
}

/**
 * Hook for debounced search with loading state using XState
 */
export function useDebouncedSearch<T>(
  searchFn: (query: string) => Promise<T[]>,
  delay = 300
): UseDebouncedSearchReturn<T> {
  const [state, send] = useMachine(createSearchMachine<T>(searchFn, delay))

  const setQuery = useCallback(
    (query: string) => {
      send({ type: 'UPDATE_QUERY', query })
    },
    [send]
  )

  return {
    query: getQuery(state),
    setQuery,
    results: getResults(state),
    isSearching: isSearching(state),
    debouncedQuery: getDebouncedQuery(state),
  }
}
