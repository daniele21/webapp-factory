export function trackRouteChange(loc: { pathname: string }) {
  if (typeof window === 'undefined') return
  const gtag = (window as any).gtag as ((...args: unknown[]) => void) | undefined
  if (!gtag) return
  gtag('event', 'page_view', { page_path: loc.pathname })
}
