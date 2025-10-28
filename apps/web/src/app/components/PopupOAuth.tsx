import React, { useEffect, useRef, useState } from 'react';

interface PopupOAuthProps {
  provider?: string; // 'google' | 'github' etc.
  width?: number;
  height?: number;
  onSuccess?: (payload: { provider: string; token?: string }) => void;
  onError?: (error: Error) => void;
  loginPath?: string; // relative path to login endpoint (default /auth/{provider}/login)
}

export const PopupOAuth: React.FC<PopupOAuthProps> = ({
  provider = 'google',
  width = 500,
  height = 700,
  onSuccess,
  onError,
  loginPath,
}) => {
  const popupRef = useRef<Window | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      try {
        // Only accept messages from same origin for safety
        if (e.origin !== window.location.origin) return;
        const data = e.data || {};
        if (data.type === 'oauth' && data.provider === provider) {
          setIsOpen(false);
          if (data.status === 'success') {
            if (onSuccess) onSuccess({ provider, token: data.token });
          } else {
            if (onError) onError(new Error('OAuth failed'));
          }
        }
      } catch (err) {
        if (onError) onError(err as Error);
      }
    }

    window.addEventListener('message', handleMessage);
    const timer = setInterval(() => {
      // detect if popup closed by user
      if (popupRef.current && popupRef.current.closed) {
        clearInterval(timer);
        setIsOpen(false);
      }
    }, 500);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(timer);
    };
  }, [provider, onSuccess, onError]);

  function openPopup() {
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;
    const loginUrl = loginPath
      ? loginPath.replace('{provider}', provider)
      : `/auth/${provider}/login?redirect=${encodeURIComponent(window.location.href)}`;

    // Open a blank window first to avoid some popup blockers, then assign
    // the location. Use a unique window name so subsequent opens reuse the
    // same popup instead of replacing the current tab.
    try {
      const opts = `width=${width},height=${height},left=${left},top=${top}`;
      const winName = `oauth_popup_${provider}_${Date.now()}`;
      // Open a blank popup window
      popupRef.current = window.open('', winName, opts);
      if (!popupRef.current) {
        if (onError) onError(new Error('Popup blocked'));
        return;
      }

      // Set location to the login URL in the popup
      try {
        popupRef.current.location.href = loginUrl;
      } catch (err) {
        // In some browsers cross-origin navigation may throw; fallback to setting
        // via assign on the popup window.
        try {
          popupRef.current.location.assign(loginUrl);
        } catch (e) {
          console.error('Failed to navigate popup to login URL', e);
          if (onError) onError(e as Error);
        }
      }

      popupRef.current.focus();
      setIsOpen(true);
      console.debug('Opened OAuth popup to', loginUrl);
    } catch (err) {
      console.error('openPopup error', err);
      if (onError) onError(err as Error);
    }
  }

  return (
    <button onClick={openPopup} aria-pressed={isOpen}>
      Sign in with {provider}
    </button>
  );
};

export default PopupOAuth;
