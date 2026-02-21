/**
 * Data Fetch State Machine
 *
 * XState machine for data fetching with loading, error, and retry logic
 */

import { assign, fromPromise, setup } from 'xstate'

interface FetchContext<T> {
  data: T | null
  error: Error | null
  retries: number
  maxRetries: number
  retryDelay: number
  cache: { data: T; timestamp: number } | null
  cacheTime: number
}

type FetchEvent =
  | { type: 'FETCH' }
  | { type: 'RETRY' }
  | { type: 'SUCCESS'; data: unknown }
  | { type: 'FAILURE'; error: Error }
  | { type: 'RESET' }
  | { type: 'CANCEL' }

export function createDataFetchMachine<T>(
  fetchFn: () => Promise<T>,
  options: {
    retryCount?: number
    retryDelay?: number
    cacheTime?: number
  } = {}
): ReturnType<
  ReturnType<
    typeof setup<{
      context: FetchContext<T>
      events: FetchEvent
    }>
  >['createMachine']
> {
  const { retryCount = 0, retryDelay = 1000, cacheTime = 0 } = options

  return setup({
    types: {
      context: {} as FetchContext<T>,
      events: {} as FetchEvent,
    },
    actors: {
      fetchData: fromPromise(async () => {
        const result = await fetchFn()
        return result
      }),
    },
    actions: {
      setData: assign({
        data: ({ event }) => {
          if ('output' in event) {
            return event.output as T
          }
          return null
        },
        error: null,
      }),
      setCachedData: assign({
        data: ({ context }) => context.cache?.data || null,
        error: null,
      }),
      setError: assign({
        error: ({ event }) => {
          if ('error' in event) {
            return event.error
          }
          return new Error('Unknown error')
        },
      }),
      cacheData: assign({
        cache: ({ context }) => {
          if (context.cacheTime > 0 && context.data) {
            return { data: context.data, timestamp: Date.now() }
          }
          return null
        },
      }),
      clearCache: assign({
        cache: null,
      }),
      incrementRetries: assign({
        retries: ({ context }) => context.retries + 1,
      }),
      resetRetries: assign({
        retries: 0,
      }),
      resetContext: assign({
        data: null,
        error: null,
        retries: 0,
        cache: null,
      }),
    },
    delays: {
      delayedRetry: ({ context }: { context: FetchContext<T> }) =>
        context.retryDelay * (context.retries + 1),
    },
  }).createMachine({
    id: 'dataFetch',
    initial: 'idle',
    context: {
      data: null,
      error: null,
      retries: 0,
      maxRetries: retryCount,
      retryDelay,
      cache: null,
      cacheTime,
    },
    states: {
      idle: {
        on: {
          FETCH: [
            {
              target: 'checkingCache',
              guard: ({ context }) => context.cacheTime > 0,
            },
            {
              target: 'loading',
            },
          ],
          RESET: {
            actions: 'resetContext',
          },
        },
      },
      checkingCache: {
        always: [
          {
            target: 'cached',
            guard: ({ context }) => {
              if (!context.cache) {
                return false
              }
              const age = Date.now() - context.cache.timestamp
              return age < context.cacheTime
            },
          },
          {
            target: 'loading',
          },
        ],
      },
      cached: {
        entry: 'setCachedData',
        on: {
          FETCH: {
            target: 'loading',
            actions: 'clearCache',
          },
          RESET: {
            target: 'idle',
            actions: 'resetContext',
          },
        },
      },
      loading: {
        invoke: {
          src: 'fetchData',
          onDone: {
            target: 'success',
            actions: ['setData', 'cacheData', 'resetRetries'],
          },
          onError: [
            {
              target: 'retrying',
              guard: ({ context }) => context.retries < context.maxRetries,
              actions: 'incrementRetries',
            },
            {
              target: 'error',
              actions: 'setError',
            },
          ],
        },
        on: {
          CANCEL: {
            target: 'idle',
          },
        },
      },
      retrying: {
        after: {
          delayedRetry: {
            target: 'loading',
          },
        },
        on: {
          CANCEL: {
            target: 'idle',
          },
          RESET: {
            target: 'idle',
            actions: 'resetContext',
          },
        },
      },
      success: {
        on: {
          FETCH: {
            target: 'loading',
          },
          RESET: {
            target: 'idle',
            actions: 'resetContext',
          },
        },
      },
      error: {
        on: {
          RETRY: {
            target: 'loading',
            actions: 'resetRetries',
          },
          FETCH: {
            target: 'loading',
            actions: 'resetRetries',
          },
          RESET: {
            target: 'idle',
            actions: 'resetContext',
          },
        },
      },
    },
  })
}

// Selectors
export const isLoading = (state: { value: unknown }): boolean =>
  state.value === 'loading' || state.value === 'retrying'

export const hasData = <T>(state: { context: FetchContext<T> }): boolean =>
  state.context.data !== null

export const hasError = <T>(state: { context: FetchContext<T> }): boolean =>
  state.context.error !== null

export const getData = <T>(state: { context: FetchContext<T> }): T | null => state.context.data

export const getError = <T>(state: { context: FetchContext<T> }): Error | null =>
  state.context.error

// Paginated fetch machine
interface PaginatedContext<T> {
  items: T[]
  total: number
  page: number
  limit: number
  loading: boolean
  error: Error | null
  hasMore: boolean
}

type PaginatedEvent =
  | { type: 'LOAD_PAGE'; page: number }
  | { type: 'LOAD_MORE' }
  | { type: 'SUCCESS'; data: { items: unknown[]; total: number } }
  | { type: 'FAILURE'; error: Error }
  | { type: 'RESET' }

export function createPaginatedFetchMachine<T>(
  fetchFn: (page: number, limit: number) => Promise<{ items: T[]; total: number }>,
  limit = 20
): ReturnType<
  ReturnType<
    typeof setup<{
      context: PaginatedContext<T>
      events: PaginatedEvent
    }>
  >['createMachine']
> {
  return setup({
    types: {
      context: {} as PaginatedContext<T>,
      events: {} as PaginatedEvent,
    },
    actors: {
      fetchPage: fromPromise(async ({ input }: { input: { page: number; limit: number } }) => {
        const result = await fetchFn(input.page, input.limit)
        return result
      }),
    },
    actions: {
      setPage: assign({
        page: ({ event }) => {
          if (event.type === 'LOAD_PAGE') {
            return event.page
          }
          return 1
        },
      }),
      incrementPage: assign({
        page: ({ context }) => context.page + 1,
      }),
      setLoading: assign({
        loading: true,
      }),
      clearLoading: assign({
        loading: false,
      }),
      appendItems: assign({
        items: ({ context, event }) => {
          if (
            'output' in event &&
            event.output &&
            typeof event.output === 'object' &&
            'items' in event.output
          ) {
            const output = event.output as { items: T[]; total: number }
            const newItems = output.items
            return context.page === 1 ? newItems : [...context.items, ...newItems]
          }
          return context.items
        },
      }),
      updatePagination: assign({
        total: ({ event }) => {
          if (
            'output' in event &&
            event.output &&
            typeof event.output === 'object' &&
            'total' in event.output
          ) {
            const output = event.output as { items: T[]; total: number }
            return output.total
          }
          return 0
        },
        hasMore: ({ context, event }) => {
          if (
            'output' in event &&
            event.output &&
            typeof event.output === 'object' &&
            'items' in event.output &&
            'total' in event.output
          ) {
            const output = event.output as { items: T[]; total: number }
            return context.items.length + output.items.length < output.total
          }
          return false
        },
      }),
      setErrorState: assign({
        error: ({ event }) => {
          if ('error' in event) {
            return event.error
          }
          return new Error('Unknown error')
        },
      }),
      resetPaginationContext: assign({
        items: [],
        total: 0,
        page: 1,
        loading: false,
        error: null,
        hasMore: true,
      }),
    },
  }).createMachine({
    id: 'paginatedFetch',
    initial: 'idle',
    context: {
      items: [],
      total: 0,
      page: 1,
      limit,
      loading: false,
      error: null,
      hasMore: true,
    },
    states: {
      idle: {
        on: {
          LOAD_PAGE: {
            target: 'loading',
            actions: 'setPage',
          },
          LOAD_MORE: {
            target: 'loading',
            guard: ({ context }) => context.hasMore && !context.loading,
            actions: 'incrementPage',
          },
          RESET: {
            actions: 'resetPaginationContext',
          },
        },
      },
      loading: {
        entry: 'setLoading',
        invoke: {
          src: 'fetchPage',
          input: ({ context }) => ({ page: context.page, limit: context.limit }),
          onDone: {
            target: 'idle',
            actions: ['appendItems', 'updatePagination', 'clearLoading'],
          },
          onError: {
            target: 'error',
            actions: ['setErrorState', 'clearLoading'],
          },
        },
      },
      error: {
        on: {
          LOAD_PAGE: {
            target: 'loading',
            actions: 'setPage',
          },
          LOAD_MORE: {
            target: 'loading',
            guard: ({ context }) => context.hasMore,
          },
          RESET: {
            target: 'idle',
            actions: 'resetPaginationContext',
          },
        },
      },
    },
  })
}
