import { useCallback, useRef } from 'react'

interface MagneticOptions {
  strength?: number
  maxDistance?: number
}

export const useMagneticHover = (
  options: MagneticOptions = {}
): { ref: (element: HTMLElement | null) => void | (() => void) } => {
  const { strength = 0.3, maxDistance = 40 } = options
  const ref = useRef<HTMLElement | null>(null)
  const rafId = useRef<number | null>(null)

  const resetPosition = useCallback(() => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current)
    }

    rafId.current = requestAnimationFrame(() => {
      if (ref.current) {
        ref.current.style.transform = 'translate(0, 0)'
        ref.current.style.transition = 'transform 0.3s ease-out'
      }
    })
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!ref.current) {
        return
      }

      const rect = ref.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const distanceX = e.clientX - centerX
      const distanceY = e.clientY - centerY

      const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2)

      if (distance < maxDistance) {
        const translateX = distanceX * strength
        const translateY = distanceY * strength

        if (rafId.current) {
          cancelAnimationFrame(rafId.current)
        }

        rafId.current = requestAnimationFrame(() => {
          if (ref.current) {
            ref.current.style.transform = `translate(${translateX}px, ${translateY}px)`
            ref.current.style.transition = 'transform 0.1s ease-out'
          }
        })
      } else {
        resetPosition()
      }
    },
    [strength, maxDistance, resetPosition]
  )

  const handleMouseLeave = useCallback(() => {
    resetPosition()
  }, [resetPosition])

  const bind = useCallback(
    (element: HTMLElement | null) => {
      if (!element) {
        return
      }

      ref.current = element
      const parent = element.parentElement

      if (parent) {
        parent.addEventListener('mousemove', handleMouseMove)
        parent.addEventListener('mouseleave', handleMouseLeave)

        return () => {
          parent.removeEventListener('mousemove', handleMouseMove)
          parent.removeEventListener('mouseleave', handleMouseLeave)
          if (rafId.current) {
            cancelAnimationFrame(rafId.current)
          }
        }
      }
    },
    [handleMouseMove, handleMouseLeave]
  )

  return { ref: bind }
}
