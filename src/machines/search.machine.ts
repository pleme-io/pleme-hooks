/**
 * Debounced Search State Machine
 *
 * XState machine for handling debounced search with loading states
 */

import { assign, fromCallback, fromPromise, setup } from 'xstate'

interface SearchContext<T> {
  query: string
  results: T[]
  error: string | null
  delay: number
}

type SearchEvent<T> =
  | { type: 'UPDATE_QUERY'; query: string }
  | { type: 'SEARCH' }
  | { type: 'SEARCH_SUCCESS'; results: T[] }
  | { type: 'SEARCH_ERROR'; error: string }
  | { type: 'CLEAR' }
  | { type: 'SET_DELAY'; delay: number }

// Function type for search operations
type SearchFunction<T> = (query: string) => Promise<T[]>

export function createSearchMachine<T>(
  searchFn: SearchFunction<T>,
  initialDelay = 300
): ReturnType<
  ReturnType<
    typeof setup<{
      context: SearchContext<T>
      events: SearchEvent<T>
    }>
  >['createMachine']
> {
  return setup({
    types: {
      context: {} as SearchContext<T>,
      events: {} as SearchEvent<T>,
    },
    actors: {
      performSearch: fromPromise(
        async ({ input }: { input: { query: string; searchFn: SearchFunction<T> } }) => {
          const { query, searchFn } = input
          return searchFn(query)
        }
      ),
      debounceTimer: fromCallback(({ sendBack, input }) => {
        const { delay } = input as { delay: number }

        const timer = setTimeout(() => {
          sendBack({ type: 'SEARCH' })
        }, delay)

        return () => clearTimeout(timer)
      }),
    },
    actions: {
      updateQuery: assign({
        query: ({ event }) => {
          if (event.type === 'UPDATE_QUERY') {
            return event.query
          }
          return ''
        },
      }),
      setResults: assign({
        results: ({ event }) => {
          if ('output' in event && Array.isArray(event.output)) {
            return event.output as T[]
          }
          return []
        },
        error: null,
      }),
      setError: assign({
        error: ({ event }) => {
          if ('error' in event && typeof event.error === 'string') {
            return event.error
          }
          return 'Search error'
        },
        results: [],
      }),
      clearResults: assign({
        results: [],
      }),
      clearError: assign({
        error: null,
      }),
      clearAll: assign({
        query: '',
        results: [],
        error: null,
      }),
      setDelay: assign({
        delay: ({ event }) => {
          if (event.type === 'SET_DELAY') {
            return event.delay
          }
          return 300
        },
      }),
    },
  }).createMachine({
    id: 'debouncedSearch',
    initial: 'idle',
    context: {
      query: '',
      results: [],
      error: null,
      delay: initialDelay,
    },
    states: {
      idle: {
        on: {
          UPDATE_QUERY: [
            {
              target: 'debouncing',
              guard: ({ event }) => event.query.length > 0,
              actions: ['updateQuery'],
            },
            {
              target: 'idle',
              actions: ['updateQuery', 'clearResults'],
            },
          ],
          SET_DELAY: {
            actions: ['setDelay'],
          },
        },
      },
      debouncing: {
        invoke: {
          src: 'debounceTimer',
          input: ({ context }) => ({ delay: context.delay }),
        },
        on: {
          UPDATE_QUERY: [
            {
              target: 'debouncing',
              guard: ({ event }) => event.query.length > 0,
              actions: ['updateQuery'],
              reenter: true,
            },
            {
              target: 'idle',
              actions: ['updateQuery', 'clearResults'],
            },
          ],
          SEARCH: {
            target: 'searching',
          },
          SET_DELAY: {
            actions: ['setDelay'],
          },
        },
      },
      searching: {
        invoke: {
          src: 'performSearch',
          input: ({ context }) => ({
            query: context.query,
            searchFn,
          }),
          onDone: {
            target: 'idle',
            actions: ['setResults'],
          },
          onError: {
            target: 'error',
            actions: ['setError'],
          },
        },
        on: {
          UPDATE_QUERY: {
            target: 'debouncing',
            actions: ['updateQuery'],
          },
        },
      },
      error: {
        on: {
          UPDATE_QUERY: {
            target: 'debouncing',
            actions: ['updateQuery', 'clearError'],
          },
          CLEAR: {
            target: 'idle',
            actions: ['clearAll'],
          },
        },
      },
    },
  })
}

// Selectors
export function getQuery<T>(state: { context: SearchContext<T> }): string {
  return state.context.query
}

export function getResults<T>(state: { context: SearchContext<T> }): T[] {
  return state.context.results
}

export function getError<T>(state: { context: SearchContext<T> }): string | null {
  return state.context.error
}

export function isSearching(state: { value: unknown }): boolean {
  return state.value === 'searching'
}

export function getDebouncedQuery<T>(state: { context: SearchContext<T> }): string {
  // In debouncing or searching states, the query is considered "debounced"
  return state.context.query
}
