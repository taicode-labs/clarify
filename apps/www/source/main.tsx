import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'

import App from './App'
import '@clarify-labs/renderer/style.css'
import './index.css'

const rootElement = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, app)
} else {
  createRoot(rootElement).render(app)
}
