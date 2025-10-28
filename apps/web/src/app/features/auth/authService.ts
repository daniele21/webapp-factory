export async function startGoogleLogin(redirectPath = '/auth') {
  // Ask backend for a Google login URL and then redirect the browser there.
  const redirect = `${location.origin}${redirectPath}`
  const res = await fetch(`/api/google/login?redirect=${encodeURIComponent(redirect)}`)
  if (!res.ok) throw new Error('Failed to start Google login')
  const body = await res.json()
  if (body.redirect) {
    // navigate to provider
    window.location.href = body.redirect
  } else {
    throw new Error('No redirect returned from auth endpoint')
  }
}

export async function fetchMe() {
  const res = await fetch('/api/me', { credentials: 'include' })
  if (!res.ok) return null
  return res.json()
}

export async function logout() {
  const res = await fetch('/api/logout', { method: 'POST', credentials: 'include' })
  if (!res.ok) throw new Error('Logout failed')
  return res.json()
}
