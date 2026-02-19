import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

try {
  const root = document.getElementById('root')
  if (!root) {
    console.error('Root element not found')
    document.body.innerHTML = '<div style="padding: 20px; color: red;">Fatal Error: Root element not found</div>'
  } else {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  }
} catch (error) {
  console.error('Failed to mount app:', error)
  document.body.innerHTML = `<div style="padding: 20px; color: red; font-family: monospace; white-space: pre-wrap;">
FATAL ERROR:
${String(error)}
${error instanceof Error ? error.stack : ''}
  </div>`
}
