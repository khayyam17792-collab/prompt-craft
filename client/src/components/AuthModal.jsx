import { useState } from 'react'
import { LogIn, UserPlus } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'
import { Field, Input } from './Input'
import { useAuth } from '../hooks/useAuth'

export default function AuthModal() {
  const { authModal } = useAuth()
  if (!authModal.open) return null
  return <AuthModalContent key={authModal.mode} />
}

function AuthModalContent() {
  const { authModal, signIn, signUp, isConfigured } = useAuth()
  const { open, mode: initialMode, closeAuth } = authModal

  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const isSignUp = mode === 'signup'

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      if (isSignUp) {
        const { needsConfirmation } = await signUp({ email, password, username })
        if (needsConfirmation) {
          setNotice('Check your inbox to confirm your email, then sign in.')
          setMode('login')
        } else {
          closeAuth()
        }
      } else {
        await signIn({ email, password })
        closeAuth()
      }
      setPassword('')
    } catch (err) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={closeAuth} title={isSignUp ? 'Create your account' : 'Welcome back'}>
      {!isConfigured && (
        <p className="mb-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-200">
          Supabase isn't configured. Add <code className="font-mono">VITE_SUPABASE_URL</code> and{' '}
          <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> to <code className="font-mono">client/.env</code>.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {isSignUp && (
          <Field label="Username" htmlFor="auth-username" hint="3–32 letters, numbers, or underscores">
            <Input
              id="auth-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              pattern="[A-Za-z0-9_]{3,32}"
              required
              autoComplete="username"
              placeholder="promptsmith"
            />
          </Field>
        )}
        <Field label="Email" htmlFor="auth-email">
          <Input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Password" htmlFor="auth-password" hint={isSignUp ? 'At least 6 characters' : undefined}>
          <Input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            placeholder="••••••••"
          />
        </Field>

        {error && (
          <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">
            {notice}
          </p>
        )}

        <Button type="submit" disabled={busy || !isConfigured} className="mt-1 justify-center">
          {isSignUp ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
          {busy ? 'Please wait…' : isSignUp ? 'Sign up' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-400">
        {isSignUp ? 'Already have an account?' : 'New here?'}{' '}
        <button
          type="button"
          onClick={() => {
            setMode(isSignUp ? 'login' : 'signup')
            setError('')
          }}
          className="font-medium text-glow-400 hover:underline"
        >
          {isSignUp ? 'Sign in' : 'Create an account'}
        </button>
      </p>
    </Modal>
  )
}
