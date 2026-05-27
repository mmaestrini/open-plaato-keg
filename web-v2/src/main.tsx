import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { I18nProvider } from './lib/i18n'
import { DemoModeProvider } from './lib/demo'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <DemoModeProvider>
        <App />
      </DemoModeProvider>
    </I18nProvider>
  </React.StrictMode>,
)
