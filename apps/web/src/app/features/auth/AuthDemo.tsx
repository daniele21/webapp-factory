import React, { useEffect, useState } from 'react'
import { startGoogleLogin, fetchMe, logout } from './authService'
import { OAuthButton, Button } from '../../components/design-system'

const AuthDemo = () => {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const u = await fetchMe()
      setUser(u)
    } catch (err) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Auth demo</h1>
      <div className="space-y-4">
        <div>
          <OAuthButton onClick={() => startGoogleLogin('/auth')}>Sign in with Google</OAuthButton>
        </div>

        <div>
          <Button onClick={() => load()} variant="outline">Refresh /me</Button>
        </div>

        <div>
          {loading ? (
            <div>Loading user...</div>
          ) : user ? (
            <div className="rounded-md border p-4">
              <div className="font-medium">Signed in</div>
              <pre className="mt-2 text-sm">{JSON.stringify(user, null, 2)}</pre>
              <div className="mt-3">
                <Button onClick={async () => { await logout(); await load() }} variant="secondary">Logout</Button>
              </div>
            </div>
          ) : (
            <div className="text-muted-fg">Not signed in.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthDemo
