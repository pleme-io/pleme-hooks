/**
 * Modal and Dialog Hooks
 *
 * XState-based modal state management
 */

import { useMachine } from '@xstate/react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  confirmDialogMachine,
  createModalManagerMachine,
  isConfirmDialogOpen,
  isConfirming,
  isModalOpen,
  modalMachine,
} from '../machines/modal.machine'

export interface UseModalOptions {
  defaultOpen?: boolean
  closeOnEscape?: boolean
  closeOnClickOutside?: boolean
}

export interface UseModalReturn {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  modalProps: {
    open: boolean
    onClose: () => void
  }
}

/**
 * Hook for managing modal/dialog state
 */
export function useModal(options: UseModalOptions = {}): UseModalReturn {
  const { defaultOpen = false, closeOnEscape = true, closeOnClickOutside = true } = options

  const [state, send] = useMachine(modalMachine, {
    input: {
      closeOnEscape,
      closeOnClickOutside,
    },
  })

  const modalRef = useRef<HTMLDivElement>(null)

  // Open modal if defaultOpen is true
  useEffect(() => {
    if (defaultOpen && !isModalOpen(state)) {
      send({ type: 'OPEN' })
    }
  }, [defaultOpen, send, state])

  const open = useCallback(() => {
    send({ type: 'OPEN' })
  }, [send])

  const close = useCallback(() => {
    send({ type: 'CLOSE' })
  }, [send])

  const toggle = useCallback(() => {
    send({ type: 'TOGGLE' })
  }, [send])

  // Handle escape key
  useEffect(() => {
    if (!isModalOpen(state) || !state.context.closeOnEscape) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [state, close])

  // Handle click outside
  useEffect(() => {
    if (!isModalOpen(state) || !state.context.closeOnClickOutside) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        close()
      }
    }

    // Delay to prevent immediate close on open
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [state, close])

  return {
    isOpen: isModalOpen(state),
    open,
    close,
    toggle,
    modalProps: {
      open: isModalOpen(state),
      onClose: close,
    },
  }
}

export interface UseModalManagerReturn<T extends string> {
  activeModal: T | null
  open: (modalId: T) => void
  close: () => void
  isOpen: (modalId: T) => boolean
  getModalProps: (modalId: T) => { open: boolean; onClose: () => void }
}

/**
 * Hook for managing multiple modals
 */
export function useModalManager<T extends string>(): UseModalManagerReturn<T> {
  const machine = useMemo(() => createModalManagerMachine<T>(), [])
  const [state, send] = useMachine(machine)

  const open = useCallback(
    (modalId: T) => {
      send({ type: 'OPEN_MODAL', modalId })
    },
    [send]
  )

  const close = useCallback(() => {
    send({ type: 'CLOSE_MODAL' })
  }, [send])

  const isOpen = useCallback(
    (modalId: T) => {
      return state.context.activeModal === modalId
    },
    [state.context.activeModal]
  )

  const getModalProps = useCallback(
    (modalId: T) => ({
      open: state.context.activeModal === modalId,
      onClose: close,
    }),
    [state.context.activeModal, close]
  )

  return {
    activeModal: state.context.activeModal,
    open,
    close,
    isOpen,
    getModalProps,
  }
}

export interface UseConfirmDialogReturn {
  isOpen: boolean
  isConfirming: boolean
  confirm: (message?: string) => Promise<boolean>
  dialogProps: {
    open: boolean
    onConfirm: () => Promise<void>
    onCancel: () => void
    loading: boolean
  }
}

/**
 * Hook for confirmation dialogs
 */
export function useConfirmDialog(options?: {
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
}): UseConfirmDialogReturn {
  const [state, send] = useMachine(confirmDialogMachine)
  const resolveRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback(
    async (message?: string): Promise<boolean> => {
      send({ type: 'CONFIRM', message })

      return new Promise<boolean>((resolve) => {
        resolveRef.current = resolve
      })
    },
    [send]
  )

  const handleConfirm = useCallback(async () => {
    send({ type: 'HANDLE_CONFIRM' })

    try {
      await options?.onConfirm?.()
      resolveRef.current?.(true)
      send({ type: 'CONFIRM_SUCCESS' })
    } catch (error) {
      send({ type: 'CONFIRM_ERROR' })
      throw error
    } finally {
      resolveRef.current = null
    }
  }, [options, send])

  const handleCancel = useCallback(() => {
    options?.onCancel?.()
    resolveRef.current?.(false)
    send({ type: 'CANCEL' })
    resolveRef.current = null
  }, [options, send])

  return {
    isOpen: isConfirmDialogOpen(state),
    isConfirming: isConfirming(state),
    confirm,
    dialogProps: {
      open: isConfirmDialogOpen(state),
      onConfirm: handleConfirm,
      onCancel: handleCancel,
      loading: isConfirming(state),
    },
  }
}
