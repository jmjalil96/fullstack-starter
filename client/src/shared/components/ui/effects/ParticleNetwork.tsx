import { useEffect, useRef } from 'react'

export function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = canvas.width = canvas.offsetWidth
    let height = canvas.height = canvas.offsetHeight

    const particles: Particle[] = []
    const particleCount = 60 // Number of nodes
    const connectionDistance = 150 // Distance to draw lines
    const mouseDistance = 200

    // Mouse state
    const mouse = { x: -1000, y: -1000 }

    class Particle {
      x: number
      y: number
      vx: number
      vy: number
      size: number

      constructor() {
        this.x = Math.random() * width
        this.y = Math.random() * height
        this.vx = (Math.random() - 0.5) * 0.5 // Slow speed
        this.vy = (Math.random() - 0.5) * 0.5
        this.size = Math.random() * 2 + 1
      }

      update() {
        this.x += this.vx
        this.y += this.vy

        // Bounce off edges
        if (this.x < 0 || this.x > width) this.vx *= -1
        if (this.y < 0 || this.y > height) this.vy *= -1

        // Mouse interaction
        const dx = mouse.x - this.x
        const dy = mouse.y - this.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < mouseDistance) {
          const forceDirectionX = dx / dist
          const forceDirectionY = dy / dist
          const force = (mouseDistance - dist) / mouseDistance
          const directionX = forceDirectionX * force * 0.5
          const directionY = forceDirectionY * force * 0.5
          this.vx += directionX
          this.vy += directionY
        }
      }

      draw() {
        if (!ctx) return
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)' // White nodes
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Init
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height)

      // Update and draw particles
      particles.forEach(p => {
        p.update()
        p.draw()
      })

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < connectionDistance) {
            ctx.beginPath()
            // Opacity based on distance
            const opacity = 1 - dist / connectionDistance
            ctx.strokeStyle = `rgba(20, 184, 166, ${opacity * 0.4})` // Teal lines
            ctx.lineWidth = 1
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      requestAnimationFrame(animate)
    }

    animate()

    // Resize handler
    const handleResize = () => {
      width = canvas.width = canvas.offsetWidth
      height = canvas.height = canvas.offsetHeight
    }

    // Mouse handlers
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }

    window.addEventListener('resize', handleResize)
    canvas.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('resize', handleResize)
      canvas.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return <canvas ref={canvasRef} className="w-full h-full bg-[#051124]" />
}
