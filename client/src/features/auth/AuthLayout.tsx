import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { ParticleNetwork } from '../../shared/components/ui/effects/ParticleNetwork'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle: string
  backLink?: { to: string; label: string }
}

export function AuthLayout({ children, title, subtitle, backLink }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex overflow-hidden bg-white">

      {/* --- Left Side: Form (Clean, Light) --- */}
      <div className="w-full lg:w-[40%] flex flex-col justify-center p-8 lg:p-20 relative z-10 bg-white">
        <div className="w-full max-w-sm mx-auto">

          {/* Brand Logo */}
          <div className="mb-12">
            <Link to="/" className="text-4xl font-bold text-[var(--color-navy)] tracking-tight">
              Capstone<span className="text-[var(--color-gold)]">360°</span>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-[var(--color-navy)] mb-3 tracking-tight">
              {title}
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Form Content */}
          <div className="relative">
            {children}
          </div>

          {/* Back Link (Bottom) */}
          {backLink && (
            <div className="mt-8 pt-8 border-t border-gray-100">
              <Link
                to={backLink.to}
                className="text-sm text-gray-400 hover:text-[var(--color-navy)] transition-colors font-medium"
              >
                ← {backLink.label}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* --- Right Side: Interactive Particle Network --- */}
      <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden bg-[#051124]">
        {/* The Canvas Component */}
        <div className="absolute inset-0 z-0">
          <ParticleNetwork />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col h-full justify-end p-16 pointer-events-none">
          <div className="bg-[#051124]/80 backdrop-blur-sm p-8 border-l-4 border-[var(--color-gold)] max-w-md">
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
              Ecosistema de Salud 360°
            </h2>
            <p className="text-white/60 text-sm leading-relaxed">
              Tecnología que conecta cada punto de tu red corporativa para una gestión de salud sin interrupciones.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
