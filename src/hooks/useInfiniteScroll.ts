/**
 * Infinite Scroll Hook
 *
 * Intersection Observer-based hook for infinite scrolling with XState
 */

import { useActorRef } from '@xstate/react'
import { type RefObject, useCallback, useEffect, useRef } from 'react'
import { hasMore, infiniteScrollMachine, isLoading } from '../machines/infiniteScroll.machine'

export interface UseInfiniteScrollOptions {
  /**
   * Callback to load more data
   */
  onLoadMore: () => void | Promise<void>

  /**
   * Whether there's more data to load
   * @default true
   */
  hasMore?: boolean

  /**
   * Intersection threshold (0-1)
   * @default 0.1
   */
  threshold?: number

  /**
   * Root margin for intersection observer
   * @default '0px'
   */
  rootMargin?: string

  /**
   * Root element for intersection observer
   * @default null (viewport)
   */
  root?: Element | null

  /**
   * Whether hook is enabled
   * @default true
   */
  enabled?: boolean
}

export interface UseInfiniteScrollReturn<T extends HTMLElement> {
  /**
   * Ref to attach to sentinel element
   */
  ref: RefObject<T>

  /**
   * Whether currently loading
   */
  loading: boolean

  /**
   * Whether there's more data
   */
  hasMore: boolean

  /**
   * Reset state
   */
  reset: () => void
}

/**
 * Hook for infinite scroll with Intersection Observer
 */
export function useInfiniteScroll<T extends HTMLElement = HTMLDivElement>(
  options: UseInfiniteScrollOptions
): UseInfiniteScrollReturn<T> {
  const {
    onLoadMore,
    hasMore: hasMoreData = true,
    threshold = 0.1,
    rootMargin = '0px',
    root = null,
    enabled = true,
  } = options

  const ref = useRef<T>(null)
  const actor = useActorRef(infiniteScrollMachine)
  const state = actor.getSnapshot()

  // Update hasMore in machine when prop changes
  useEffect(() => {
    if (!hasMoreData) {
      actor.send({ type: 'NO_MORE_DATA' })
    }
  }, [hasMoreData, actor])

  // Intersection Observer
  useEffect(() => {
    if (!enabled || !ref.current) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          actor.send({ type: 'INTERSECTING' })
          actor.send({ type: 'LOAD_MORE' })
        } else {
          actor.send({ type: 'NOT_INTERSECTING' })
        }
      },
      {
        root,
        rootMargin,
        threshold,
      }
    )

    observer.observe(ref.current)

    return () => {
      observer.disconnect()
    }
  }, [enabled, root, rootMargin, threshold, actor])

  // Load more when machine is in loading state
  useEffect(() => {
    if (state.matches('loading')) {
      const loadData = async () => {
        await onLoadMore()
        actor.send({ type: 'LOADED' })
      }
      loadData()
    }
  }, [onLoadMore, actor, state.matches])

  const reset = useCallback(() => {
    actor.send({ type: 'RESET' })
  }, [actor])

  return {
    ref,
    loading: isLoading(state),
    hasMore: hasMore(state),
    reset,
  }
}
