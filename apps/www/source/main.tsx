import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'

import App from './App'
import { getClientPath } from './ssg-routes'
import './i18n'
import '@clarify-labs/renderer/style.css'
import './index.css'

const rootElement = document.getElementById('root')!
const clientPath = getClientPath()
const app = (
  <StrictMode>
    <App path={clientPath} />
  </StrictMode>
)

if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, app)
} else {
  createRoot(rootElement).render(app)
}
