import { createRoutesFromElements, Route } from 'react-router-dom'
import App from './App'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import StyleDemo from './pages/StyleDemo'
import UiLibrary from './pages/UiLibrary'
import CookiePolicy from './pages/legal/CookiePolicy'
import Terms from './pages/legal/Terms'

export const routes = createRoutesFromElements(
  <Route element={<App />}>
    <Route index element={<Home />} />
    <Route path="/home" element={<Dashboard />} />
    <Route path="/style-demo" element={<StyleDemo />} />
    <Route path="/ui-library" element={<UiLibrary />} />
    <Route path="/legal/cookies" element={<CookiePolicy />} />
    <Route path="/legal/terms" element={<Terms />} />
  </Route>
)
