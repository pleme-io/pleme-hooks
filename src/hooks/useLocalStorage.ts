/**
 * Local Storage Hook
 *
 * Type-safe localStorage with automatic JSON parsing
 */

import { useMachine } from '@xstate/react'
import { useCallback, useMemo } from 'react'
import { logger } from '../utils/logger'
import { createLocalStorageMachine, getStorageValue } from '../machines/localStorage.machine'

type StorageValue<T> = T | null

export interface UseLocalStorageOptions {
  serializer?: (value: unknown) => string
  deserializer?: (value: string) => unknown
  syncAcrossTabs?: boolean
}

/**
 * Hook for type-safe localStorage operations
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions = {}
): [StorageValue<T>, (value: T | ((prev: T) => T)) => void, () => void] {
  const { serializer = JSON.stringify, deserializer = JSON.parse, syncAcrossTabs = true } = options

  const machine = useMemo(
    () =>
      createLocalStorageMachine(key, initialValue, { serializer, deserializer, syncAcrossTabs }),
    [key, initialValue, serializer, deserializer, syncAcrossTabs]
  )

  const [state, send] = useMachine(machine)
  const storedValue = getStorageValue(state)

  // Write to localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      if (value instanceof Function) {
        send({ type: 'UPDATE_VALUE', updater: value })
      } else {
        send({ type: 'SET_VALUE', value })
      }
    },
    [send]
  )

  // Remove from localStorage
  const removeValue = useCallback(() => {
    send({ type: 'REMOVE_VALUE' })
  }, [send])

  return [storedValue, setValue, removeValue]
}

export interface UseAuthTokenReturn {
  token: string | null
  isAuthenticated: boolean
  login: (newToken: string) => void
  logout: () => void
}

/**
 * Hook specifically for auth token management
 */
export function useAuthToken(): UseAuthTokenReturn {
  const [token, setToken, removeToken] = useLocalStorage<string>('auth_token', '')

  const isAuthenticated = Boolean(token)

  const login = useCallback(
    (newToken: string) => {
      setToken(newToken)
      logger.auth('User logged in')
    },
    [setToken]
  )

  const logout = useCallback(() => {
    removeToken()
    logger.auth('User logged out')
    window.location.href = '/login'
  }, [removeToken])

  return {
    token,
    isAuthenticated,
    login,
    logout,
  }
}
