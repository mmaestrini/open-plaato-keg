import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Header } from './components/Header'
import { TapRoom } from './pages/TapRoom'
import { AirlockRoute } from './pages/AirlockRoute'
import { KegsPage } from './pages/KegsPage'
import { HistoryPage } from './pages/HistoryPage'
import { SettingsPage } from './pages/SettingsPage'
import { TapSetupPage } from './pages/TapSetupPage'
import { BeveragesPage } from './pages/BeveragesPage'
import { TransferScalesPage } from './pages/TransferScalesPage'
import { AirlockSetupPage } from './pages/AirlockSetupPage'

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/"          element={<TapRoom />} />
        <Route path="/airlocks"  element={<AirlockRoute />} />
        <Route path="/kegs"      element={<KegsPage />} />
        <Route path="/taps"      element={<TapSetupPage />} />
        <Route path="/beverages" element={<BeveragesPage />} />
        <Route path="/transfer-scales" element={<TransferScalesPage />} />
        <Route path="/airlocks/setup"  element={<AirlockSetupPage />} />
        <Route path="/history"   element={<HistoryPage />} />
        <Route path="/settings"  element={<SettingsPage />} />
        {/* Catch-all: redirect unknown paths to tap room */}
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
