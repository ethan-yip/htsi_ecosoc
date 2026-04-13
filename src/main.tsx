import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.tsx'
import { NotificationProvider } from './lib/notifications/NotificationProvider'
import { NotificationViewport } from './components/NotificationViewport'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NotificationProvider>
      <App />
      <NotificationViewport />
    </NotificationProvider>
  </StrictMode>,
)
