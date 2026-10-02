import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Library as LibraryIcon, LogIn, Plus } from 'lucide-react'
import PromptCard from '../components/PromptCard'
import EmptyState from '../components/EmptyState'
import Button from '../components/Button'
import { prompts as promptsApi, ApiError } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

export default function Library() {
  const { user, loading, authModal } = useAuth()
  const [result, setResult] = useState(null)

  const userId = user?.id ?? null

  useEffect(() => {
    if (!userId) return undefined
    const controller = new AbortController()
    promptsApi
      .mine(controller.signal)
      .then(({ data }) => setResult({ userId, items: data, error: '' }))
      .catch((err) => {
        if (err.name === 'AbortError') return
        setResult({
          userId,
          items: [],
          error: err instanceof ApiError ? err.message : 'Could not reach the API server.',
        })
      })
    return () => controller.abort()
  }, [userId])

  const current = result?.userId === userId ? result : null
  const status = loading
    ? 'loading'
    : !userId
      ? 'anon'
      : !current
        ? 'loading'
        : current.error
          ? 'error'
          : 'ready'
  const items = current?.items ?? []
  const error = current?.error ?? ''

  function setItems(updater) {
    setResult((prev) => (prev ? { ...prev, items: updater(prev.items) } : prev))
  }

  if (status === 'anon') {
    return (
      <EmptyState
        icon={LogIn}
        title="Sign in to see your prompts"
        action={
          <Button onClick={() => authModal.openAuth('login')}>
            <LogIn className="h-4 w-4" /> Sign in
          </Button>
        }
      >
        Your private and public prompts will show up here once you're signed in.
      </EmptyState>
    )
  }

  if (status === 'error') {
    return (
      <EmptyState icon={LibraryIcon} title="Couldn't load your prompts">
        {error}
      </EmptyState>
    )
  }

  if (status === 'ready' && items.length === 0) {
    return (
      <EmptyState
        icon={LibraryIcon}
        title="Your prompt library is empty"
        action={
          <Link to="/prompts/new">
            <Button>
              <Plus className="h-4 w-4" /> Create your first prompt
            </Button>
          </Link>
        }
      >
        Prompts you create in the Playground are saved to your library.
      </EmptyState>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{status === 'loading' ? 'Loading…' : `${items.length} prompt${items.length === 1 ? '' : 's'}`}</span>
        <Link to="/prompts/new" className="inline-flex items-center gap-1 text-glow-400 hover:underline">
          <Plus className="h-3.5 w-3.5" /> New prompt
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((prompt) => (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            onLikeChange={(id, next) => setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...next } : p)))}
          />
        ))}
      </div>
    </div>
  )
}
