import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorFallback } from './components/ErrorFallback.tsx'
import { initSentry, SentryErrorBoundary } from './sentry.ts'

initSentry()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SentryErrorBoundary fallback={<ErrorFallback />}>
      <App />
    </SentryErrorBoundary>
  </StrictMode>,
)
