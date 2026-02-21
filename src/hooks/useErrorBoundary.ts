/**
 * Modern Error Boundary Hook
 *
 * Provides a functional interface to work with Error Boundaries
 */

import { useActor, useMachine } from '@xstate/react'
import { useCallback } from 'react'
// TODO: Fix import - errorHandler.machine needs to be moved to pleme-hooks or made available
// import { errorHandlerMachine } from '../components/ErrorBoundary/errorHandler.machine'
import { logger } from '../utils/logger'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  resetError: () => void
  captureError: (error: Error) => void
}

/**
 * Hook to programmatically work with error boundaries
 */
export function useErrorBoundary(): ErrorBoundaryState {
  // TODO: Fix errorHandlerMachine import
  // const [state, send] = useMachine(errorHandlerMachine)

  const resetError = useCallback(() => {
    // TODO: Fix errorHandlerMachine import
    // send({ type: 'RESET_ERROR' })
  }, [])

  const captureError = useCallback(
    (error: Error) => {
      logger.error('Error captured by boundary hook', error, 'useErrorBoundary')
      // TODO: Fix errorHandlerMachine import
      // send({ type: 'CAPTURE_ERROR', error })

      // TODO: Fix bugMonitoring import
      // In production, report to monitoring
      // if (import.meta.env.PROD) {
      //   import('../services/bugMonitoring').then(({ reportCustomError }) => {
      //     reportCustomError(`Error Boundary Hook: ${error.message}`, 'high', { stack: error.stack })
      //   })
      // }
    },
    []
  )

  return {
    // TODO: Fix errorHandlerMachine import
    hasError: false, // state.matches('error'),
    error: null, // state.context.error,
    resetError,
    captureError,
  }
}

export interface UseErrorHandlerReturn {
  hasError: boolean
  error: Error | null
  captureError: (error: Error) => void
  resetError: () => void
}

/**
 * Hook that integrates with XState error handler machine
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  // TODO: Fix errorHandlerMachine import
  // const [state, send] = useActor(errorHandlerMachine)

  const captureError = useCallback(
    (error: Error) => {
      // TODO: Fix errorHandlerMachine import
      // send({ type: 'CAPTURE_ERROR', error })
      logger.error('Error captured by handler', error, 'useErrorHandler')
    },
    []
  )

  const resetError = useCallback(() => {
    // TODO: Fix errorHandlerMachine import
    // send({ type: 'RESET_ERROR' })
  }, [])

  return {
    // TODO: Fix errorHandlerMachine import
    hasError: false, // state.matches('error'),
    error: null, // state.context.error,
    captureError,
    resetError,
  }
}

/**
 * Hook for async error handling
 */
export function useAsyncError(): (error: Error) => never {
  // TODO: Fix errorHandlerMachine import
  // const [_state, send] = useMachine(errorHandlerMachine)

  return useCallback(
    (error: Error) => {
      // TODO: Fix errorHandlerMachine import
      // Capture the error in the state machine
      // send({ type: 'CAPTURE_ERROR', error })
      logger.error('Async error captured', error, 'useAsyncError')
      // Then throw it to be caught by the error boundary
      throw error
    },
    []
  )
}
