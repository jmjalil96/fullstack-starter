import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import App from './App.tsx'
import { ToastProvider } from './providers/ToastProvider'
import { AuthInitializer } from './shared/components/AuthInitializer'
import { ErrorBoundary } from './shared/components/ErrorBoundary'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Failed to find root element. Ensure index.html has <div id="root"></div>')
}

createRoot(rootElement).render(
  <StrictMode>
    <ToastProvider>
      <ErrorBoundary>
        <AuthInitializer>
          <App />
        </AuthInitializer>
      </ErrorBoundary>
    </ToastProvider>
  </StrictMode>
)
