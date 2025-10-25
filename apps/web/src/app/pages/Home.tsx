import { useAuth } from '../providers/AuthProvider'

export default function Home() {
  const { user, loading, login, logout } = useAuth()
  if (loading) return <p>Loading…</p>
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Welcome</h1>
      {user ? (
        <>
          <p>Signed in as {user.email}</p>
          <button className="border px-3 py-1 rounded" onClick={logout}>Logout</button>
        </>
      ) : (
        <button className="border px-3 py-1 rounded" onClick={login}>Login with Google</button>
      )}
    </div>
  )
}
