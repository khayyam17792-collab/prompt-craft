import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Library, LogIn, LogOut, Plus, UserPlus } from 'lucide-react'
import Button from './Button'
import { useAuth } from '../hooks/useAuth'

function initialsOf(user) {
  const name = user?.user_metadata?.username ?? user?.email ?? '?'
  return name.slice(0, 2).toUpperCase()
}

export default function Header({ title }) {
  const { user, loading, signOut, authModal } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return undefined
    const onClick = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  return (
    <header className="glass relative z-30 flex items-center justify-between px-6 py-3">
      <h1 className="text-lg font-semibold tracking-tight text-white">{title}</h1>

      <div className="flex items-center gap-3">
        {user && (
          <Button onClick={() => navigate('/prompts/new')}>
            <Plus className="h-4 w-4" />
            New prompt
          </Button>
        )}

        {loading ? (
          <div className="h-9 w-24 animate-pulse rounded-xl bg-white/5" />
        ) : user ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-3 text-sm text-slate-200 transition hover:bg-white/10"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500 to-glow-500 text-xs font-bold text-white">
                {initialsOf(user)}
              </span>
              <span className="max-w-32 truncate">{user.user_metadata?.username ?? user.email}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="glass-strong absolute right-0 z-50 mt-2 w-56 overflow-hidden p-1.5 text-sm shadow-glow"
              >
                <p className="truncate px-3 py-2 text-xs text-slate-400">{user.email}</p>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    navigate('/library')
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-slate-200 hover:bg-white/10"
                >
                  <Library className="h-4 w-4" /> My prompts
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={async () => {
                    setMenuOpen(false)
                    await signOut()
                    navigate('/')
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-rose-300 hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Button variant="ghost" onClick={() => authModal.openAuth('login')}>
              <LogIn className="h-4 w-4" />
              Sign in
            </Button>
            <Button onClick={() => authModal.openAuth('signup')}>
              <UserPlus className="h-4 w-4" />
              Sign up
            </Button>
          </>
        )}
      </div>
    </header>
  )
}
