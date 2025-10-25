let loaded = false
export function initAnalytics() {
  const id = import.meta.env.VITE_PUBLIC_ANALYTICS_KEY
  if (!id || loaded) return
  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`
  document.head.appendChild(s)
  const inline = document.createElement('script')
  inline.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config','${id}');`
  document.head.appendChild(inline)
  loaded = true
}
export function trackRouteChange(loc: { pathname: string }) {
  const id = (window as any).gtag ? import.meta.env.VITE_PUBLIC_ANALYTICS_KEY : null
  if (id && (window as any).gtag) (window as any).gtag('event', 'page_view', { page_path: loc.pathname })
}
