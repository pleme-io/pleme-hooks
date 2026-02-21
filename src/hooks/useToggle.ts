/**
 * Toggle Hook
 *
 * Simple hook for boolean toggle state with named actions
 */

import { useCallback, useState } from 'react'

export interface UseToggleReturn {
  /**
   * Current value
   */
  value: boolean

  /**
   * Toggle value
   */
  toggle: () => void

  /**
   * Set to true
   */
  setTrue: () => void

  /**
   * Set to false
   */
  setFalse: () => void

  /**
   * Set to specific value
   */
  setValue: (value: boolean) => void
}

/**
 * Hook for boolean toggle state
 */
export function useToggle(initialValue = false): UseToggleReturn {
  const [value, setValue] = useState(initialValue)

  const toggle = useCallback(() => {
    setValue((v) => !v)
  }, [])

  const setTrue = useCallback(() => {
    setValue(true)
  }, [])

  const setFalse = useCallback(() => {
    setValue(false)
  }, [])

  return {
    value,
    toggle,
    setTrue,
    setFalse,
    setValue,
  }
}

/**
 * Alias for useToggle
 */
export const useBoolean: typeof useToggle = useToggle
