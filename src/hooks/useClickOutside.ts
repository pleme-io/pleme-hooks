/**
 * Click Outside Hook
 *
 * Detect clicks outside of element(s) with escape key support
 */

import { type RefObject, useEffect, useRef } from 'react'

export interface UseClickOutsideOptions {
  /**
   * Whether hook is enabled
   * @default true
   */
  enabled?: boolean

  /**
   * Listen for escape key
   * @default true
   */
  escapeKey?: boolean

  /**
   * Event types to listen for
   * @default ['mousedown', 'touchstart']
   */
  eventTypes?: Array<keyof DocumentEventMap>
}

/**
 * Hook for detecting clicks outside element(s)
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: (event: MouseEvent | TouchEvent | KeyboardEvent) => void,
  options: UseClickOutsideOptions = {}
): RefObject<T> {
  const { enabled = true, escapeKey = true, eventTypes = ['mousedown', 'touchstart'] } = options

  const ref = useRef<T>(null)

  useEffect(() => {
    if (!enabled) {
      return
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // Check if click is outside ref element
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler(event)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handler(event)
      }
    }

    // Add click/touch listeners
    eventTypes.forEach((eventType) => {
      document.addEventListener(eventType, handleClickOutside as EventListener)
    })

    // Add escape key listener
    if (escapeKey) {
      document.addEventListener('keydown', handleEscape)
    }

    // Cleanup
    return () => {
      eventTypes.forEach((eventType) => {
        document.removeEventListener(eventType, handleClickOutside as EventListener)
      })
      if (escapeKey) {
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [handler, enabled, escapeKey, eventTypes])

  return ref
}

/**
 * Hook for detecting clicks outside multiple elements
 */
export function useClickOutsideMultiple(
  handler: (event: MouseEvent | TouchEvent | KeyboardEvent) => void,
  options: UseClickOutsideOptions = {}
): {
  refs: RefObject<HTMLElement>[]
  addRef: (ref: RefObject<HTMLElement>) => void
  removeRef: (ref: RefObject<HTMLElement>) => void
} {
  const { enabled = true, escapeKey = true, eventTypes = ['mousedown', 'touchstart'] } = options

  const refsRef = useRef<RefObject<HTMLElement>[]>([])

  useEffect(() => {
    if (!enabled) {
      return
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // Check if click is outside all refs
      const clickedOutside = refsRef.current.every(
        (ref) => ref.current && !ref.current.contains(event.target as Node)
      )

      if (clickedOutside) {
        handler(event)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handler(event)
      }
    }

    // Add click/touch listeners
    eventTypes.forEach((eventType) => {
      document.addEventListener(eventType, handleClickOutside as EventListener)
    })

    // Add escape key listener
    if (escapeKey) {
      document.addEventListener('keydown', handleEscape)
    }

    // Cleanup
    return () => {
      eventTypes.forEach((eventType) => {
        document.removeEventListener(eventType, handleClickOutside as EventListener)
      })
      if (escapeKey) {
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [handler, enabled, escapeKey, eventTypes])

  const addRef = (ref: RefObject<HTMLElement>) => {
    if (!refsRef.current.includes(ref)) {
      refsRef.current.push(ref)
    }
  }

  const removeRef = (ref: RefObject<HTMLElement>) => {
    refsRef.current = refsRef.current.filter((r) => r !== ref)
  }

  return {
    refs: refsRef.current,
    addRef,
    removeRef,
  }
}
