import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import './index.css'
import { initStorage } from './services/init'

// Detect the storage backend (Cloudflare R2 + D1 via the Pages API, or
// browser-local), then seed the sample library so the site is never empty.
void initStorage()

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found')

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
