/**
 * Media Query Hook
 *
 * SSR-safe hook for responsive breakpoint detection
 */

import { type Breakpoint, useTheme } from '@mui/material/styles'
import { useEffect, useState } from 'react'

export interface UseMediaQueryOptions {
  /**
   * Default value for SSR
   * @default false
   */
  defaultValue?: boolean

  /**
   * Disable SSR check (use only on client)
   * @default false
   */
  noSsr?: boolean
}

/**
 * Hook for media query matching with MUI theme integration
 */
export function useMediaQuery(
  query: string | ((theme: ReturnType<typeof useTheme>) => string),
  options: UseMediaQueryOptions = {}
): boolean {
  const { defaultValue = false, noSsr = false } = options
  const theme = useTheme()

  const queryString = typeof query === 'function' ? query(theme) : query

  const [matches, setMatches] = useState<boolean>(() => {
    if (noSsr && typeof window !== 'undefined') {
      return window.matchMedia(queryString).matches
    }
    return defaultValue
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQueryList = window.matchMedia(queryString)
    setMatches(mediaQueryList.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Modern browsers
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleChange)
      return () => {
        mediaQueryList.removeEventListener('change', handleChange)
      }
    }

    // Legacy browsers
    mediaQueryList.addListener(handleChange)
    return () => {
      mediaQueryList.removeListener(handleChange)
    }
  }, [queryString])

  return matches
}

/**
 * Hook for MUI breakpoint matching
 */
export function useBreakpoint(
  breakpoint: Breakpoint,
  direction: 'up' | 'down' | 'only' = 'up'
): boolean {
  const _theme = useTheme()

  const query = (t: ReturnType<typeof useTheme>) => {
    switch (direction) {
      case 'up':
        return t.breakpoints.up(breakpoint)
      case 'down':
        return t.breakpoints.down(breakpoint)
      case 'only':
        return t.breakpoints.only(breakpoint)
      default:
        return t.breakpoints.up(breakpoint)
    }
  }

  return useMediaQuery(query)
}

/**
 * Hook for checking if viewport is mobile
 */
export function useIsMobile(): boolean {
  return useBreakpoint('sm', 'down')
}

/**
 * Hook for checking if viewport is tablet
 */
export function useIsTablet(): boolean {
  const _theme = useTheme()
  return useMediaQuery((t) => t.breakpoints.between('sm', 'md'))
}

/**
 * Hook for checking if viewport is desktop
 */
export function useIsDesktop(): boolean {
  return useBreakpoint('md', 'up')
}
