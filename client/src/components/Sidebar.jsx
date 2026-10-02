import { NavLink } from 'react-router-dom'
import { Compass, FlaskConical, Library, Settings, Sparkles } from 'lucide-react'
import { cn } from '../lib/cn'

const navItems = [
  { to: '/', label: 'Explorer', icon: Compass, end: true },
  { to: '/prompts/new', label: 'Playground', icon: FlaskConical },
  { to: '/library', label: 'My Prompts', icon: Library },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  return (
    <aside className="glass-strong flex h-full w-64 shrink-0 flex-col p-4">
      <NavLink to="/" className="mb-8 flex items-center gap-3 px-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-glow-500 shadow-glow">
          <Sparkles className="h-5 w-5 text-white" />
        </span>
        <div>
          <p className="text-sm font-semibold tracking-tight text-white">PromptCraft</p>
          <p className="text-xs text-slate-400">Studio</p>
        </div>
      </NavLink>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-white/10 text-white shadow-glass'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="glass mt-4 p-3 text-xs text-slate-400">
        <p className="font-medium text-slate-300">v0.1.0</p>
        <p>React · Express · Supabase</p>
      </div>
    </aside>
  )
}
