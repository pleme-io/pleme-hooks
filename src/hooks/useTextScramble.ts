import { useEffect, useRef, useState } from 'react'

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

interface UseTextScrambleOptions {
  text: string
  duration?: number
  delay?: number
  trigger?: boolean
}

export const useTextScramble = ({
  text,
  duration = 1000,
  delay = 0,
  trigger = true,
}: UseTextScrambleOptions): string => {
  const [displayText, setDisplayText] = useState('')
  const requestRef = useRef<number>()
  const startTimeRef = useRef<number>()

  useEffect(() => {
    if (!trigger || !text) {
      return
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp + delay
      }

      const elapsed = timestamp - startTimeRef.current

      if (elapsed < 0) {
        requestRef.current = requestAnimationFrame(animate)
        return
      }

      const progress = Math.min(elapsed / duration, 1)
      const revealedLength = Math.floor(text.length * progress)

      let scrambled = ''
      for (let i = 0; i < text.length; i++) {
        if (i < revealedLength) {
          scrambled += text[i]
        } else if (i < revealedLength + 3 && text[i] !== ' ') {
          // Scramble next few characters
          scrambled += chars[Math.floor(Math.random() * chars.length)]
        } else if (text[i] === ' ') {
          scrambled += ' '
        }
      }

      setDisplayText(scrambled)

      if (progress < 1) {
        requestRef.current = requestAnimationFrame(animate)
      }
    }

    requestRef.current = requestAnimationFrame(animate)

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
      startTimeRef.current = undefined
    }
  }, [text, duration, delay, trigger])

  return displayText
}
