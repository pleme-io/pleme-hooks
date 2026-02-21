/**
 * Local Storage State Machine
 *
 * XState machine for localStorage state management
 */

import { assign, fromCallback, setup } from 'xstate'
import { logger } from '../utils/logger'

interface LocalStorageContext<T> {
  key: string
  value: T | null
  initialValue: T
  syncAcrossTabs: boolean
  serializer: (value: unknown) => string
  deserializer: (value: string) => unknown
}

type LocalStorageEvent<T> =
  | { type: 'SET_VALUE'; value: T }
  | { type: 'UPDATE_VALUE'; updater: (prev: T) => T }
  | { type: 'REMOVE_VALUE' }
  | { type: 'SYNC_FROM_STORAGE'; value: T | null }
  | { type: 'STORAGE_ERROR'; error: Error }

export function createLocalStorageMachine<T>(
  key: string,
  initialValue: T,
  options: {
    serializer?: (value: unknown) => string
    deserializer?: (value: string) => unknown
    syncAcrossTabs?: boolean
  } = {}
): ReturnType<
  ReturnType<
    typeof setup<{
      context: LocalStorageContext<T>
      events: LocalStorageEvent<T>
    }>
  >['createMachine']
> {
  const { serializer = JSON.stringify, deserializer = JSON.parse, syncAcrossTabs = true } = options

  return setup({
    types: {
      context: {} as LocalStorageContext<T>,
      events: {} as LocalStorageEvent<T>,
    },
    actions: {
      readFromStorage: assign({
        value: ({ context }) => {
          try {
            const item = window.localStorage.getItem(context.key)
            if (item === null) {
              return context.initialValue
            }
            return context.deserializer(item) as T
          } catch (error) {
            logger.warn(
              `Error reading localStorage key "${context.key}"`,
              error,
              'LocalStorageMachine'
            )
            return context.initialValue
          }
        },
      }),
      setValue: assign({
        value: ({ event }) => {
          if (event.type === 'SET_VALUE') {
            return event.value
          }
          return null
        },
      }),
      updateValue: assign({
        value: ({ context, event }) => {
          if (event.type === 'UPDATE_VALUE') {
            const currentValue = context.value || context.initialValue
            return event.updater(currentValue)
          }
          return context.value
        },
      }),
      removeValue: assign({
        value: null,
      }),
      syncValue: assign({
        value: ({ event }) => {
          if (event.type === 'SYNC_FROM_STORAGE') {
            return event.value
          }
          return null
        },
      }),
      writeToStorage: ({ context }: { context: LocalStorageContext<T> }) => {
        try {
          if (context.value === null || context.value === undefined) {
            window.localStorage.removeItem(context.key)
          } else {
            window.localStorage.setItem(context.key, context.serializer(context.value))
          }
        } catch (error) {
          logger.error(
            `Error writing to localStorage key "${context.key}"`,
            error,
            'LocalStorageMachine'
          )
        }
      },
      removeFromStorage: ({ context }: { context: LocalStorageContext<T> }) => {
        try {
          window.localStorage.removeItem(context.key)
        } catch (error) {
          logger.error(
            `Error removing localStorage key "${context.key}"`,
            error,
            'LocalStorageMachine'
          )
        }
      },
      dispatchStorageEvent: ({ context }: { context: LocalStorageContext<T> }) => {
        if (!context.syncAcrossTabs) {
          return
        }

        try {
          window.dispatchEvent(
            new StorageEvent('storage', {
              key: context.key,
              newValue: context.value === null ? null : context.serializer(context.value),
              url: window.location.href,
              storageArea: window.localStorage,
            })
          )
        } catch (error) {
          logger.error(
            `Error dispatching storage event for key "${context.key}"`,
            error,
            'LocalStorageMachine'
          )
        }
      },
      logError: ({ event }) => {
        if (event.type === 'STORAGE_ERROR') {
          logger.warn('Storage sync error', event.error, 'LocalStorageMachine')
        }
      },
    },
    guards: {
      syncAcrossTabs: ({ context }) => context.syncAcrossTabs,
    },
    actors: {
      storageListener: fromCallback(({ sendBack }) => {
        const handleStorageChange = (e: StorageEvent) => {
          if (e.storageArea === window.localStorage && e.key === key) {
            try {
              if (e.newValue === null) {
                sendBack({ type: 'SYNC_FROM_STORAGE', value: null })
              } else {
                const value = deserializer(e.newValue) as T
                sendBack({ type: 'SYNC_FROM_STORAGE', value })
              }
            } catch (error) {
              sendBack({ type: 'STORAGE_ERROR', error: error as Error })
            }
          }
        }

        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
      }),
    },
  }).createMachine({
    id: 'localStorage',
    initial: 'reading',
    context: {
      key,
      value: null,
      initialValue,
      syncAcrossTabs,
      serializer,
      deserializer,
    },
    states: {
      reading: {
        always: {
          target: 'ready',
          actions: 'readFromStorage',
        },
      },
      ready: {
        invoke: {
          src: 'storageListener',
          id: 'storage-sync',
        },
        on: {
          SET_VALUE: {
            actions: ['setValue', 'writeToStorage', 'dispatchStorageEvent'],
          },
          UPDATE_VALUE: {
            actions: ['updateValue', 'writeToStorage', 'dispatchStorageEvent'],
          },
          REMOVE_VALUE: {
            actions: ['removeValue', 'removeFromStorage', 'dispatchStorageEvent'],
          },
          SYNC_FROM_STORAGE: {
            actions: 'syncValue',
            guard: 'syncAcrossTabs',
          },
          STORAGE_ERROR: {
            actions: 'logError',
          },
        },
      },
    },
  })
}

// Selectors
export const getStorageValue = <T>(state: { context: LocalStorageContext<T> }): T | null =>
  state.context.value

export const getStorageKey = <T>(state: { context: LocalStorageContext<T> }): string =>
  state.context.key
