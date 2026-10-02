import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      className={`relative w-9 h-9 rounded-full flex items-center justify-center border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 transition-all duration-200 active:scale-95 group focus:outline-none ${className || ''}`}
    >
      {theme === 'light' ? (
        <Moon className="w-4 h-4 text-slate-700 transition-transform duration-200 group-hover:-rotate-12" />
      ) : (
        <Sun className="w-4 h-4 text-amber-300 transition-transform duration-200 group-hover:rotate-45" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
