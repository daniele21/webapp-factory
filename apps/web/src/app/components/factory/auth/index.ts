/**
 * Factory Auth Components
 * 
 * Secure authentication components with best practices
 */

export { GoogleOAuthPopup, type GoogleOAuthPopupProps, type GoogleUser } from './GoogleOAuthPopup'
export { createGoogleOAuthConfig, defaultGoogleOAuthConfig, type GoogleOAuthConfig } from './GoogleOAuthConfig'

// Re-export examples for documentation
export { default as GoogleOAuthPopupExamples } from './GoogleOAuthPopup.examples'
