/**
 * Infinite Scroll State Machine
 *
 * XState v5 machine for managing infinite scroll state
 */

import { assign, setup } from 'xstate'

// Context
interface InfiniteScrollContext {
  isIntersecting: boolean
  hasMore: boolean
  isLoading: boolean
}

// Events
type InfiniteScrollEvent =
  | { type: 'INTERSECTING' }
  | { type: 'NOT_INTERSECTING' }
  | { type: 'LOAD_MORE' }
  | { type: 'LOADED' }
  | { type: 'NO_MORE_DATA' }
  | { type: 'RESET' }

// Machine
const _infiniteScrollMachineSetup: ReturnType<
  typeof setup<{
    context: InfiniteScrollContext
    events: InfiniteScrollEvent
  }>
> = setup({
  types: {} as {
    context: InfiniteScrollContext
    events: InfiniteScrollEvent
  },
})

export const infiniteScrollMachine: ReturnType<typeof _infiniteScrollMachineSetup.createMachine> =
  _infiniteScrollMachineSetup.createMachine({
    id: 'infiniteScroll',
  initial: 'idle',
  context: {
    isIntersecting: false,
    hasMore: true,
    isLoading: false,
  },
  states: {
    idle: {
      entry: assign({
        isLoading: false,
      }),
      on: {
        INTERSECTING: {
          target: 'intersecting',
          actions: assign({
            isIntersecting: true,
          }),
        },
        RESET: {
          target: 'idle',
          actions: assign({
            hasMore: true,
            isIntersecting: false,
            isLoading: false,
          }),
        },
      },
    },
    intersecting: {
      entry: assign({
        isIntersecting: true,
      }),
      on: {
        NOT_INTERSECTING: {
          target: 'idle',
          actions: assign({
            isIntersecting: false,
          }),
        },
        LOAD_MORE: {
          target: 'loading',
          guard: ({ context }) => context.hasMore && !context.isLoading,
        },
      },
    },
    loading: {
      entry: assign({
        isLoading: true,
      }),
      on: {
        LOADED: 'idle',
        NO_MORE_DATA: {
          target: 'completed',
          actions: assign({
            hasMore: false,
          }),
        },
      },
    },
    completed: {
      entry: assign({
        isLoading: false,
        hasMore: false,
      }),
      on: {
        RESET: {
          target: 'idle',
          actions: assign({
            hasMore: true,
            isIntersecting: false,
            isLoading: false,
          }),
        },
      },
    },
  },
})

// Selectors
export const isLoading = (state: ReturnType<typeof infiniteScrollMachine.transition>): boolean =>
  state.context.isLoading

export const hasMore = (state: ReturnType<typeof infiniteScrollMachine.transition>): boolean =>
  state.context.hasMore

export const isIntersecting = (
  state: ReturnType<typeof infiniteScrollMachine.transition>
): boolean => state.context.isIntersecting
