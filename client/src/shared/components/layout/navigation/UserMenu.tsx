import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { userMenuItems } from '../../../config/navigation'
import { useAuthStore } from '../../../store/authStore'


/**
 * UserMenu - Dropdown menu for user actions
 * Features:
 * - Accessible with keyboard navigation (arrow keys, ESC)
 * - Focus trap when open
 * - Click outside to close
 * - User profile, settings, and logout
 */
export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const navigate = useNavigate()
  const signOut = useAuthStore((state) => state.signOut)
  const user = useAuthStore((state) => state.user)

  // Get user initials for avatar
  const userInitials = user?.name
    ? user.name
        .split(' ')
        .filter((n) => n.length > 0) // Filter empty strings from multiple spaces
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U'

  // Close menu on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  // Close menu on click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Arrow key navigation
  useEffect(() => {
    if (!isOpen) return

    const handleArrowKeys = (e: KeyboardEvent) => {
      if (!menuRef.current) return

      const items = Array.from(menuRef.current.querySelectorAll('[role="menuitem"]'))
      const currentIndex = items.indexOf(document.activeElement as HTMLElement)

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
        ;(items[nextIndex] as HTMLElement).focus()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
        ;(items[prevIndex] as HTMLElement).focus()
      }
    }

    document.addEventListener('keydown', handleArrowKeys)
    return () => document.removeEventListener('keydown', handleArrowKeys)
  }, [isOpen])

  const handleMenuItemClick = async (action: string) => {
    setIsOpen(false)

    switch (action) {
      case 'profile':
        navigate('/perfil')
        break
      case 'settings':
        navigate('/configuracion')
        break
      case 'logout':
        await signOut()
        navigate('/login')
        break
    }
  }

  return (
    <div ref={menuRef} className="relative">
      {/* User Avatar Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-gold)] text-[var(--color-navy)] font-semibold hover:bg-[var(--color-primary-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:ring-offset-2 focus:ring-offset-[var(--color-navy)]"
        aria-label="User menu"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {userInitials}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-[var(--color-border)] py-1 z-50"
        >
          {/* User Info */}
          <div className="px-4 py-3 border-b border-[var(--color-border)]">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              {user?.name || 'Usuario'}
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] truncate">{user?.email}</p>
          </div>

          {/* Menu Items */}
          {userMenuItems.map((item) => (
            <div key={item.action}>
              {item.divider && <div className="my-1 border-t border-[var(--color-border)]" />}
              <button
                role="menuitem"
                onClick={() => handleMenuItemClick(item.action)}
                className="w-full text-left px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] focus:bg-[var(--color-bg-hover)] focus:outline-none transition-colors"
                tabIndex={0}
              >
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
