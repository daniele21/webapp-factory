import React from 'react';
import PopupOAuth from '../components/PopupOAuth';

export default function LoginExample() {
  const handleSuccess = async ({ provider, token }: { provider: string; token?: string }) => {
    console.log('OAuth success', provider, token);
    if (token) {
      // Store token temporarily or call backend
      localStorage.setItem('jwt', token);
      // Optionally call /auth/me with Authorization header
      const res = await fetch('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const user = await res.json();
        console.log('user', user);
      }
    } else {
      // Fallback to cookie-based flow
      const res = await fetch('/auth/me', { credentials: 'include' });
      if (res.ok) {
        const user = await res.json();
        console.log('user', user);
      }
    }
  };

  const handleError = (e: Error) => {
    console.error('OAuth error', e);
  };

  return (
    <div>
      <h1>Login example</h1>
      <PopupOAuth provider="google" onSuccess={handleSuccess} onError={handleError} />
    </div>
  );
}
