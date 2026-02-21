import { useCallback, useRef } from 'react'

interface ConfettiParticle {
  x: number
  y: number
  vx: number
  vy: number
  angle: number
  angularVelocity: number
  color: string
  size: number
  life: number
}

export interface UseConfettiReturn {
  triggerConfetti: (x: number, y: number) => void
  cleanup: () => void
}

export const useConfetti = (): UseConfettiReturn => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number>()
  const particlesRef = useRef<ConfettiParticle[]>([])

  const createCanvas = useCallback(() => {
    if (!canvasRef.current) {
      const canvas = document.createElement('canvas')
      canvas.style.position = 'fixed'
      canvas.style.top = '0'
      canvas.style.left = '0'
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      canvas.style.pointerEvents = 'none'
      canvas.style.zIndex = '9999'
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      document.body.appendChild(canvas)
      canvasRef.current = canvas
    }
    return canvasRef.current
  }, [])

  const removeCanvas = useCallback(() => {
    if (canvasRef.current) {
      document.body.removeChild(canvasRef.current)
      canvasRef.current = null
    }
  }, [])

  const triggerConfetti = useCallback(
    (x: number, y: number) => {
      const canvas = createCanvas()
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        return
      }

      const colors = [
        '#ff006e',
        '#ff4d94',
        '#ff80b0',
        '#ffb3d0',
        '#ffc2d9',
        '#52b788',
        '#95d5b2',
        '#b7e4c7',
        '#d8f3dc',
      ]

      // Create particles
      const particles: ConfettiParticle[] = []
      for (let i = 0; i < 50; i++) {
        const angle = (Math.PI * 2 * i) / 50
        const velocity = 3 + Math.random() * 5

        particles.push({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity - 2,
          angle: Math.random() * Math.PI * 2,
          angularVelocity: (Math.random() - 0.5) * 0.2,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 6 + Math.random() * 4,
          life: 1,
        })
      }

      particlesRef.current = particles

      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        let hasParticles = false
        particlesRef.current = particlesRef.current.filter((particle) => {
          particle.x += particle.vx
          particle.y += particle.vy
          particle.vy += 0.3 // gravity
          particle.vx *= 0.98 // air resistance
          particle.angle += particle.angularVelocity
          particle.life -= 0.02

          if (particle.life > 0) {
            hasParticles = true
            ctx.save()
            ctx.translate(particle.x, particle.y)
            ctx.rotate(particle.angle)
            ctx.globalAlpha = particle.life
            ctx.fillStyle = particle.color
            ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size)
            ctx.restore()
            return true
          }
          return false
        })

        if (hasParticles) {
          animationRef.current = requestAnimationFrame(animate)
        } else {
          removeCanvas()
        }
      }

      animate()
    },
    [createCanvas, removeCanvas]
  )

  const cleanup = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    removeCanvas()
  }, [removeCanvas])

  return { triggerConfetti, cleanup }
}
