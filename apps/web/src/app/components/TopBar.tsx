import { ThemeSwitch } from './ThemeSwitch'

export default function TopBar(){
  return (
    <header className="border-b border-border p-3 flex items-center justify-between">
      <h1 className="font-semibold">Webapp Factory</h1>
      <ThemeSwitch />
    </header>
  )
}
