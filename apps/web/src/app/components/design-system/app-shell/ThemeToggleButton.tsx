import { Button } from '@/app/components/ui/button'
import { cn } from '@/app/lib/cn'
import { useTheme } from '../../../theme/ThemeProvider'

type ThemeToggleButtonProps = {
  className?: string
}

export function ThemeToggleButton({ className }: ThemeToggleButtonProps) {
  const { mode, setMode } = useTheme()
  const isDark = mode === 'dark'

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setMode(isDark ? 'light' : 'dark')}
      aria-label="Toggle dark mode"
      aria-pressed={isDark}
      title={isDark ? 'Passa alla modalità chiara' : 'Passa alla modalità scura'}
      className={cn(
    // Larger hit area, reduced horizontal spacing and clear focus ring
  'h-10 w-10 px-1 py-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
        'focus:outline-none focus-visible:ring-3 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 dark:focus-visible:ring-offset-slate-900 transition-colors',
        className
      )}
      // Inline style override to neutralize visual-theme's left/right padding
      style={{ paddingLeft: '0.25rem', paddingRight: '0.25rem' }}
    >
      {/* Use a slightly smaller inner icon so the button doesn't look cramped */}
      {isDark ? (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-[72%] w-[72%]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-[72%] w-[72%]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </Button>
  )
}
