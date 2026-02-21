/**
 * Copy to Clipboard Hook
 *
 * Hook for copying text to clipboard with feedback state
 */

import { useActorRef } from '@xstate/react'
import { useCallback } from 'react'
import { copyToClipboardMachine, getError, isCopied, isCopying } from '../machines/copyToClipboard.machine'

export interface UseCopyToClipboardReturn {
  /**
   * Copy text to clipboard
   */
  copy: (text: string) => void

  /**
   * Whether currently copying
   */
  copying: boolean

  /**
   * Whether text was successfully copied
   */
  copied: boolean

  /**
   * Error if copy failed
   */
  error: Error | null

  /**
   * Reset state
   */
  reset: () => void
}

export interface UseCopyToClipboardOptions {
  /**
   * Custom reset delay in milliseconds
   * @default 2000
   */
  resetDelay?: number

  /**
   * Callback when copy succeeds
   */
  onSuccess?: (text: string) => void

  /**
   * Callback when copy fails
   */
  onError?: (error: Error) => void
}

/**
 * Hook for copying text to clipboard with XState-powered feedback
 */
export function useCopyToClipboard(
  options: UseCopyToClipboardOptions = {}
): UseCopyToClipboardReturn {
  const { onSuccess, onError } = options

  const actor = useActorRef(copyToClipboardMachine)
  const state = actor.getSnapshot()

  const copy = useCallback(
    (text: string) => {
      actor.send({ type: 'COPY', text })

      // Call success/error callbacks
      const subscription = actor.subscribe((snapshot) => {
        if (snapshot.matches('success') && onSuccess) {
          onSuccess(text)
        }
        if (snapshot.matches('error') && onError && snapshot.context.error) {
          onError(snapshot.context.error)
        }
      })

      return () => subscription.unsubscribe()
    },
    [actor, onSuccess, onError]
  )

  const reset = useCallback(() => {
    actor.send({ type: 'RESET' })
  }, [actor])

  return {
    copy,
    copying: isCopying(state),
    copied: isCopied(state),
    error: getError(state),
    reset,
  }
}
