import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppShell } from './components/layout/AppShell'
import { CalendarProvider } from './core/calendar/calendarContext'
import { initLanguage } from './i18n'

// Initialize language from saved settings (default: English)
initLanguage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CalendarProvider>
      <AppShell />
    </CalendarProvider>
  </StrictMode>
)