import { createRoutesFromElements, Route } from 'react-router-dom'
import App from './App'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import CookiePolicy from './pages/legal/CookiePolicy'
import Terms from './pages/legal/Terms'

export const routes = createRoutesFromElements(
  <Route element={<App />}>
    <Route index element={<Home />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/legal/cookies" element={<CookiePolicy />} />
    <Route path="/legal/terms" element={<Terms />} />
  </Route>
)
