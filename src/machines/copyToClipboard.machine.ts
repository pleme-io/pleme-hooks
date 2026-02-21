/**
 * Copy to Clipboard State Machine
 *
 * XState v5 machine for managing copy-to-clipboard state with timeout
 */

import { assign, fromPromise, setup } from 'xstate'

// Context
interface CopyToClipboardContext {
  text: string | null
  error: Error | null
  copied: boolean
}

// Events
type CopyToClipboardEvent = { type: 'COPY'; text: string } | { type: 'RESET' } | { type: 'TIMEOUT' }

// Machine
const _copyToClipboardMachineSetup: ReturnType<
  typeof setup<{
    context: CopyToClipboardContext
    events: CopyToClipboardEvent
  }>
> = setup({
  types: {} as {
    context: CopyToClipboardContext
    events: CopyToClipboardEvent
  },
  actors: {
    copyText: fromPromise(async ({ input }: { input: { text: string } }) => {
      await navigator.clipboard.writeText(input.text)
      return input.text
    }),
  },
  delays: {
    resetDelay: 2000, // 2 seconds
  },
})

export const copyToClipboardMachine: ReturnType<typeof _copyToClipboardMachineSetup.createMachine> =
  _copyToClipboardMachineSetup.createMachine({
  id: 'copyToClipboard',
  initial: 'idle',
  context: {
    text: null,
    error: null,
    copied: false,
  },
  states: {
    idle: {
      entry: assign({
        copied: false,
        error: null,
      }),
      on: {
        COPY: {
          target: 'copying',
          guard: ({ event }) => event.text.length > 0,
          actions: assign({
            text: ({ event }) => event.text,
          }),
        },
      },
    },
    copying: {
      invoke: {
        src: 'copyText',
        input: ({ context }) => ({ text: context.text || '' }),
        onDone: {
          target: 'success',
        },
        onError: {
          target: 'error',
          actions: assign({
            error: ({ event }) => event.error as Error,
          }),
        },
      },
    },
    success: {
      entry: assign({
        copied: true,
        error: null,
      }),
      after: {
        resetDelay: 'idle',
      },
      on: {
        RESET: 'idle',
      },
    },
    error: {
      entry: assign({
        copied: false,
      }),
      after: {
        resetDelay: 'idle',
      },
      on: {
        RESET: 'idle',
        COPY: {
          target: 'copying',
          actions: assign({
            text: ({ event }) => event.text,
          }),
        },
      },
    },
  },
})

// Selectors
export const isCopying = (state: ReturnType<typeof copyToClipboardMachine.transition>): boolean =>
  state.matches('copying')

export const isCopied = (state: ReturnType<typeof copyToClipboardMachine.transition>): boolean =>
  state.context.copied

export const getError = (
  state: ReturnType<typeof copyToClipboardMachine.transition>
): Error | null => state.context.error
