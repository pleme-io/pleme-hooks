/**
 * Auto-Save Hook
 *
 * Reusable hook for auto-saving field values on blur with debouncing
 * Provides a general-purpose pattern for auto-saving form fields
 */

import { useCallback, useRef } from 'react'
import { useDebouncedCallback } from './useDebounce'

export interface UseAutoSaveOptions<T> {
  /**
   * The save function to call when the value changes
   * Should return a Promise
   */
  onSave: (value: T) => Promise<void>

  /**
   * Debounce delay in milliseconds (default: 800ms)
   */
  delay?: number

  /**
   * Optional callback when save succeeds
   */
  onSuccess?: (value: T) => void

  /**
   * Optional callback when save fails
   */
  onError?: (error: Error, value: T) => void

  /**
   * Optional validation function
   * Return true if valid, false if invalid
   */
  validate?: (value: T) => boolean
}

export interface UseAutoSaveReturn<T> {
  /**
   * Handler to call on blur
   * Pass the current value to save
   */
  handleBlur: (value: T) => void

  /**
   * Handler to call on change (optional)
   * Can be used to save on change after debounce instead of on blur
   */
  handleChange: (value: T) => void

  /**
   * Whether a save is currently in progress
   */
  isSaving: boolean

  /**
   * Last save error if any
   */
  error: Error | null
}

/**
 * Hook for auto-saving field values on blur with debouncing
 *
 * @example Basic usage
 * ```tsx
 * const { handleBlur } = useAutoSave({
 *   onSave: async (value) => {
 *     await updateAddress({ label: value })
 *   },
 * })
 *
 * return (
 *   <TextField
 *     onBlur={(e) => handleBlur(e.target.value)}
 *   />
 * )
 * ```
 *
 * @example With validation
 * ```tsx
 * const { handleBlur, error } = useAutoSave({
 *   onSave: async (value) => {
 *     await updateEmail(value)
 *   },
 *   validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
 *   onError: (err) => console.error('Save failed:', err),
 * })
 * ```
 */
export function useAutoSave<T>({
  onSave,
  delay = 800,
  onSuccess,
  onError,
  validate,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn<T> {
  const isSavingRef = useRef(false)
  const errorRef = useRef<Error | null>(null)

  const saveValue = useCallback(
    async (value: T) => {
      // Validate if validation function provided
      if (validate && !validate(value)) {
        return
      }

      isSavingRef.current = true
      errorRef.current = null

      try {
        await onSave(value)
        if (onSuccess) {
          onSuccess(value)
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        errorRef.current = err
        if (onError) {
          onError(err, value)
        }
      } finally {
        isSavingRef.current = false
      }
    },
    [onSave, onSuccess, onError, validate]
  )

  // Debounced version for onChange
  const debouncedSave = useDebouncedCallback(saveValue, delay, [saveValue])

  // Immediate save for onBlur (no debounce needed since blur is a single event)
  const handleBlur = useCallback(
    (value: T) => {
      saveValue(value)
    },
    [saveValue]
  )

  // Debounced save for onChange
  const handleChange = useCallback(
    (value: T) => {
      debouncedSave(value)
    },
    [debouncedSave]
  )

  return {
    handleBlur,
    handleChange,
    isSaving: isSavingRef.current,
    error: errorRef.current,
  }
}
