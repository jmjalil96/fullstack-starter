import { FocusTrap } from 'focus-trap-react'
import { useEffect, useRef, useState, useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  /** Whether modal is open */
  isOpen: boolean
  /** Callback to close modal */
  onClose: () => void
  /** Modal title */
  title: string
  /** Modal content */
  children: ReactNode
  /** Optional footer content (usually buttons) */
  footer?: ReactNode
  /** Modal width */
  width?: 'sm' | 'md' | 'lg' | 'xl'
}

// Track number of open modals for nested scroll lock
let openModalCount = 0

/**
 * Accessible modal dialog with glass morphism styling
 *
 * Features:
 * - WCAG 2.1 compliant (role="dialog", aria-modal, focus trap)
 * - Escape key to close
 * - Click outside to close
 * - Scroll lock (supports nested modals)
 * - Auto-focus on open
 * - Returns focus on close
 * - Smooth animations
 *
 * @example
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Edit Claim"
 *   width="lg"
 *   footer={
 *     <>
 *       <Button variant="outline" onClick={onClose}>Cancel</Button>
 *       <Button onClick={onSave}>Save</Button>
 *     </>
 *   }
 * >
 *   <FormContent />
 * </Modal>
 */
export function Modal({ isOpen, onClose, title, children, footer, width = 'md' }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [isClosing, setIsClosing] = useState(false)
  const titleId = useId()

  // Handle close with animation
  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 150) // Match animation duration
  }

  // Handle Escape key and scroll lock
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    if (isOpen) {
      openModalCount++
      document.addEventListener('keydown', handleEscape)

      // Only lock scroll for first modal
      if (openModalCount === 1) {
        document.body.style.overflow = 'hidden'
      }
    }

    return () => {
      if (isOpen) {
        openModalCount--
        document.removeEventListener('keydown', handleEscape)

        // Only unlock scroll when last modal closes
        if (openModalCount === 0) {
          document.body.style.overflow = 'unset'
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  if (!isOpen && !isClosing) return null

  const widthClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop - Not interactive, just visual */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
          isClosing ? 'animate-out fade-out' : 'animate-in fade-in'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Panel with Focus Trap */}
      <FocusTrap
        active={isOpen && !isClosing}
        focusTrapOptions={{
          initialFocus: false, // Let browser choose first focusable element
          escapeDeactivates: false, // We handle Escape manually
          clickOutsideDeactivates: true,
          returnFocusOnDeactivate: true,
        }}
      >
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={`
            relative w-full ${widthClasses[width]}
            bg-white/90 backdrop-blur-xl border border-white/20
            rounded-2xl shadow-2xl overflow-hidden
            transform transition-all duration-200
            flex flex-col max-h-[90vh]
            ${isClosing ? 'animate-out zoom-out-95 fade-out' : 'animate-in zoom-in-95 fade-in'}
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/50 bg-white/50">
            <h3 id={titleId} className="text-lg font-bold text-[var(--color-navy)]">
              {title}
            </h3>
            <button
              onClick={handleClose}
              aria-label="Close modal"
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-200/50 flex justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </FocusTrap>
    </div>,
    document.body
  )
}
