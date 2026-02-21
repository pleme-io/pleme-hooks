/**
 * Modal State Machine
 *
 * XState machine for modal state management
 */

import { assign, setup } from 'xstate'

interface ModalContext {
  closeOnEscape: boolean
  closeOnClickOutside: boolean
}

type ModalEvent =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'TOGGLE' }
  | { type: 'SET_CLOSE_OPTIONS'; closeOnEscape?: boolean; closeOnClickOutside?: boolean }

const _modalMachineSetup: ReturnType<
  typeof setup<{
    context: ModalContext
    events: ModalEvent
  }>
> = setup({
  types: {
    context: {} as ModalContext,
    events: {} as ModalEvent,
  },
  actions: {
    notifyOpen: () => {
      // Callback will be provided via options when creating machine
    },
    notifyClose: () => {
      // Callback will be provided via options when creating machine
    },
    updateCloseOptions: assign({
      closeOnEscape: ({ context, event }) => {
        if (event.type === 'SET_CLOSE_OPTIONS' && event.closeOnEscape !== undefined) {
          return event.closeOnEscape
        }
        return context.closeOnEscape
      },
      closeOnClickOutside: ({ context, event }) => {
        if (event.type === 'SET_CLOSE_OPTIONS' && event.closeOnClickOutside !== undefined) {
          return event.closeOnClickOutside
        }
        return context.closeOnClickOutside
      },
    }),
  },
})

export const modalMachine: ReturnType<typeof _modalMachineSetup.createMachine> =
  _modalMachineSetup.createMachine({
    id: 'modal',
  initial: 'closed',
  context: {
    closeOnEscape: true,
    closeOnClickOutside: true,
  },
  states: {
    closed: {
      on: {
        OPEN: {
          target: 'open',
          actions: ['notifyOpen'],
        },
        TOGGLE: {
          target: 'open',
          actions: ['notifyOpen'],
        },
        SET_CLOSE_OPTIONS: {
          actions: ['updateCloseOptions'],
        },
      },
    },
    open: {
      on: {
        CLOSE: {
          target: 'closed',
          actions: ['notifyClose'],
        },
        TOGGLE: {
          target: 'closed',
          actions: ['notifyClose'],
        },
        SET_CLOSE_OPTIONS: {
          actions: ['updateCloseOptions'],
        },
      },
    },
  },
})

// Selectors
export const isModalOpen = (state: { value: unknown }): boolean => state.value === 'open'

// Modal Manager Machine for managing multiple modals
interface ModalManagerContext<T extends string> {
  activeModal: T | null
}

type ModalManagerEvent<T extends string> =
  | { type: 'OPEN_MODAL'; modalId: T }
  | { type: 'CLOSE_MODAL' }
  | { type: 'CLOSE_SPECIFIC'; modalId: T }

export function createModalManagerMachine<T extends string>(): ReturnType<
  ReturnType<
    typeof setup<{
      context: ModalManagerContext<T>
      events: ModalManagerEvent<T>
    }>
  >['createMachine']
> {
  return setup({
    types: {
      context: {} as ModalManagerContext<T>,
      events: {} as ModalManagerEvent<T>,
    },
    actions: {
      setActiveModal: assign(({ event }) => {
        if (event.type === 'OPEN_MODAL') {
          return { activeModal: event.modalId }
        }
        return {}
      }),
      clearActiveModal: assign({
        activeModal: null,
      }),
      closeSpecificModal: assign(({ context, event }) => {
        if (event.type === 'CLOSE_SPECIFIC' && context.activeModal === event.modalId) {
          return { activeModal: null }
        }
        return {}
      }),
    },
    guards: {
      isActiveModal: ({ context, event }) => {
        return event.type === 'CLOSE_SPECIFIC' && context.activeModal === event.modalId
      },
    },
  }).createMachine({
    id: 'modalManager',
    initial: 'idle',
    context: {
      activeModal: null,
    },
    states: {
      idle: {
        on: {
          OPEN_MODAL: {
            target: 'active',
            actions: 'setActiveModal',
          },
        },
      },
      active: {
        on: {
          OPEN_MODAL: {
            actions: 'setActiveModal',
          },
          CLOSE_MODAL: {
            target: 'idle',
            actions: 'clearActiveModal',
          },
          CLOSE_SPECIFIC: {
            target: 'idle',
            actions: 'closeSpecificModal',
            guard: 'isActiveModal',
          },
        },
      },
    },
  })
}

// Confirm Dialog Machine
interface ConfirmDialogContext {
  isConfirming: boolean
  message?: string
}

type ConfirmDialogEvent =
  | { type: 'CONFIRM'; message?: string }
  | { type: 'HANDLE_CONFIRM' }
  | { type: 'CONFIRM_SUCCESS' }
  | { type: 'CONFIRM_ERROR' }
  | { type: 'CANCEL' }

const _confirmDialogMachineSetup: ReturnType<
  typeof setup<{
    context: ConfirmDialogContext
    events: ConfirmDialogEvent
  }>
> = setup({
  types: {
    context: {} as ConfirmDialogContext,
    events: {} as ConfirmDialogEvent,
  },
  actions: {
    setMessage: assign({
      message: ({ event }) => {
        if (event.type === 'CONFIRM') {
          return event.message
        }
        return undefined
      },
    }),
    clearMessage: assign({
      message: undefined,
    }),
    setConfirming: assign({
      isConfirming: true,
    }),
    clearConfirming: assign({
      isConfirming: false,
    }),
  },
})

export const confirmDialogMachine: ReturnType<typeof _confirmDialogMachineSetup.createMachine> =
  _confirmDialogMachineSetup.createMachine({
    id: 'confirmDialog',
  initial: 'closed',
  context: {
    isConfirming: false,
    message: undefined,
  },
  states: {
    closed: {
      on: {
        CONFIRM: {
          target: 'open',
          actions: ['setMessage'],
        },
      },
    },
    open: {
      initial: 'idle',
      states: {
        idle: {
          on: {
            HANDLE_CONFIRM: {
              target: 'confirming',
            },
          },
        },
        confirming: {
          entry: ['setConfirming'],
          on: {
            CONFIRM_SUCCESS: {
              target: '#confirmDialog.closed',
              actions: ['clearConfirming', 'clearMessage'],
            },
            CONFIRM_ERROR: {
              target: 'idle',
              actions: ['clearConfirming'],
            },
          },
        },
      },
      on: {
        CANCEL: {
          target: 'closed',
          actions: ['clearConfirming', 'clearMessage'],
        },
      },
    },
  },
})

// Selectors for confirm dialog
export const isConfirmDialogOpen = (state: { value: unknown }): boolean =>
  typeof state.value === 'object' && state.value !== null && 'open' in state.value

export const isConfirming = (state: { context: ConfirmDialogContext }): boolean =>
  state.context.isConfirming

export const getConfirmMessage = (state: { context: ConfirmDialogContext }): string | undefined =>
  state.context.message
