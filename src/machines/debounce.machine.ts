/**
 * Debounce State Machine
 *
 * XState machine for debouncing values
 */

import { assign, fromCallback, setup } from 'xstate'

// Generic type for debounced values
interface DebounceContext<T> {
  value: T
  debouncedValue: T
  delay: number
}

type DebounceEvent<T> =
  | { type: 'UPDATE_VALUE'; value: T }
  | { type: 'SET_DELAY'; delay: number }
  | { type: 'DEBOUNCED_UPDATE'; value: T }

export function createDebounceMachine<T>(
  initialValue: T,
  initialDelay: number
): ReturnType<
  ReturnType<
    typeof setup<{
      context: DebounceContext<T>
      events: DebounceEvent<T>
    }>
  >['createMachine']
> {
  return setup({
    types: {
      context: {} as DebounceContext<T>,
      events: {} as DebounceEvent<T>,
    },
    actors: {
      debounceTimer: fromCallback(({ sendBack, input }) => {
        const { value, delay } = input as { value: T; delay: number }

        const timer = setTimeout(() => {
          sendBack({ type: 'DEBOUNCED_UPDATE', value })
        }, delay)

        return () => clearTimeout(timer)
      }),
    },
    actions: {
      updateValue: assign({
        value: ({ event }) => {
          if (event.type === 'UPDATE_VALUE') {
            return event.value
          }
          // Should not reach here due to guard conditions
          throw new Error('Invalid event type for updateValue')
        },
      }),
      updateDebouncedValue: assign({
        debouncedValue: ({ event }) => {
          if (event.type === 'DEBOUNCED_UPDATE') {
            return event.value
          }
          // Should not reach here due to guard conditions
          throw new Error('Invalid event type for updateDebouncedValue')
        },
      }),
      setDelay: assign({
        delay: ({ event }) => {
          if (event.type === 'SET_DELAY') {
            return event.delay
          }
          // Should not reach here due to guard conditions
          throw new Error('Invalid event type for setDelay')
        },
      }),
    },
  }).createMachine({
    id: 'debounce',
    initial: 'idle',
    context: {
      value: initialValue,
      debouncedValue: initialValue,
      delay: initialDelay,
    },
    states: {
      idle: {
        on: {
          UPDATE_VALUE: {
            target: 'debouncing',
            actions: 'updateValue',
          },
          SET_DELAY: {
            actions: 'setDelay',
          },
        },
      },
      debouncing: {
        invoke: {
          src: 'debounceTimer',
          input: ({ context }) => ({
            value: context.value,
            delay: context.delay,
          }),
        },
        on: {
          UPDATE_VALUE: {
            target: 'debouncing',
            actions: 'updateValue',
            reenter: true, // Restart the timer
          },
          DEBOUNCED_UPDATE: {
            target: 'idle',
            actions: 'updateDebouncedValue',
          },
          SET_DELAY: {
            actions: 'setDelay',
          },
        },
      },
    },
  })
}

// Selectors
export function getValue<T>(state: { context: DebounceContext<T> }): T {
  return state.context.value
}

export function getDebouncedValue<T>(state: { context: DebounceContext<T> }): T {
  return state.context.debouncedValue
}
