import { useEffect, useState } from 'react'
export function useIsDesktop(breakpoint = 768) {
  const [is, setIs] = useState(() => window.innerWidth >= breakpoint)
  useEffect(() => {
    const on = () => setIs(window.innerWidth >= breakpoint)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [breakpoint])
  return is
}
