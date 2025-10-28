// Re-export types and grouped component barrels.
// Components were previously split across `tier0..tier4` files.
// To keep the API stable but easier to navigate, we expose grouped
// barrels organized by purpose (layout, form, display, overlays, controls).
export * from './types'
export * from './layout'
export * from './form'
export * from './display'
export * from './overlays'
export * from './controls'
export * from './navigation'
export * from './auth'

// Expose a few commonly used factory components directly from the barrel
export { TopBar } from './layout/TopBar'
export { SidebarNav } from './layout/SidebarNav'
export { BottomTabs } from './layout/BottomTabs'
export { Header } from './layout/Header'
export { Page } from './layout/Page'
export { DatePickerField } from './forms/DatePickerField'
export { CheckboxField } from './forms/CheckboxField'
export { SwitchField } from './forms/SwitchField'
export { TagInput } from './forms/TagInput'
export { FileDropzone } from './forms/FileDropzone'
export { FactoryForm } from './forms/FactoryForm'
export { OAuthButton } from './navigation/OAuthButton'
export { AuthMenu } from './navigation/AuthMenu'
export { GoogleOAuthPopup } from './auth/GoogleOAuthPopup'
export { default as StyleShowcase } from './StyleShowcase'

// Common factory primitives
export { Icon } from './primitives/Icon'
export { Footer } from './layout/Footer'
