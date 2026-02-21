import { useEffect, useRef, useState } from 'react'

interface UseScrollAnimationOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

export const useScrollAnimation = <T extends HTMLElement = HTMLElement>(
  options: UseScrollAnimationOptions = {}
): { ref: React.RefObject<T>; isInView: boolean } => {
  const { threshold = 0.1, rootMargin = '0px', triggerOnce = true } = options
  const [isInView, setIsInView] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<T>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting

        if (triggerOnce) {
          if (inView && !hasAnimated) {
            setIsInView(true)
            setHasAnimated(true)
          }
        } else {
          setIsInView(inView)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [threshold, rootMargin, triggerOnce, hasAnimated])

  return { ref, isInView }
}
