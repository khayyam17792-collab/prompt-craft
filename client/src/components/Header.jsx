import { Bell, Search } from 'lucide-react'
import Button from './Button'

export default function Header({ title }) {
  return (
    <header className="glass flex items-center justify-between px-6 py-3">
      <h1 className="text-lg font-semibold tracking-tight text-white">{title}</h1>

      <div className="flex items-center gap-3">
        <label className="glass flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-400">
          <Search className="h-4 w-4" />
          <input
            type="search"
            placeholder="Search prompts…"
            className="w-48 bg-transparent text-slate-200 placeholder:text-slate-500 focus:outline-none"
          />
        </label>
        <Button variant="ghost" className="px-2.5" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
