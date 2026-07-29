import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { LanguageCurrencyProvider } from './context/LanguageCurrencyContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageCurrencyProvider>
        <App />
      </LanguageCurrencyProvider>
    </ThemeProvider>
  </StrictMode>,
)
