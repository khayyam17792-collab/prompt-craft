import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownWideNarrow, Compass, Search, Sparkles, Tag, X } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import PromptCard from '../components/PromptCard'
import Badge from '../components/Badge'
import EmptyState from '../components/EmptyState'
import Button from '../components/Button'
import { Input } from '../components/Input'
import { prompts as promptsApi, ApiError } from '../lib/api'
import { useDebounce } from '../hooks/useDebounce'
import { useAuth } from '../hooks/useAuth'
import { cn } from '../lib/cn'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most liked' },
  { value: 'oldest', label: 'Oldest' },
]

export default function Explorer() {
  const { user, authModal } = useAuth()
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState(null)
  const [sort, setSort] = useState('newest')
  const [result, setResult] = useState(null)
  const [tags, setTags] = useState([])

  const debouncedSearch = useDebounce(search, 250)
  const requestKey = JSON.stringify([debouncedSearch, activeTag, sort, user?.id ?? null])

  useEffect(() => {
    const controller = new AbortController()
    promptsApi
      .tags(controller.signal)
      .then(({ data }) => setTags(data))
      .catch(() => {})
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    promptsApi
      .list({ q: debouncedSearch, tag: activeTag, sort, limit: 60 }, controller.signal)
      .then(({ data, pagination }) =>
        setResult({ key: requestKey, items: data, total: pagination.total, error: '' }),
      )
      .catch((err) => {
        if (err.name === 'AbortError') return
        setResult({
          key: requestKey,
          items: [],
          total: 0,
          error: err instanceof ApiError ? err.message : 'Could not reach the API server.',
        })
      })
    return () => controller.abort()
  }, [requestKey, debouncedSearch, activeTag, sort])

  const isStale = result?.key !== requestKey
  const status = !result || (isStale && !result.items.length) ? 'loading' : result.error ? 'error' : isStale ? 'loading' : 'ready'
  const items = result?.items ?? []
  const total = result?.total ?? 0
  const error = result?.error ?? ''

  const visibleTags = useMemo(() => tags.slice(0, 18), [tags])

  function handleLikeChange(id, next) {
    setResult((prev) =>
      prev ? { ...prev, items: prev.items.map((p) => (p.id === id ? { ...p, ...next } : p)) } : prev,
    )
  }

  function toggleTag(tag) {
    setActiveTag((current) => (current === tag ? null : tag))
  }

  return (
    <div className="flex flex-col gap-5">
      <GlassCard className="relative overflow-hidden p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-accent-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-glow-500/20 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-accent-400">Explore</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
              Discover <span className="text-gradient">community prompts</span>
            </h2>
            <p className="mt-2 max-w-lg text-sm text-slate-400">
              Search public templates, filter by tag, and open any prompt in the Playground to fill in variables
              and copy the result.
            </p>
          </div>
          {!user && (
            <Button onClick={() => authModal.openAuth('signup')}>
              <Sparkles className="h-4 w-4" />
              Sign up to publish prompts
            </Button>
          )}
        </div>

        <div className="relative mt-6 flex flex-wrap items-center gap-3">
          <label className="relative flex-1 min-w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or description…"
              className="pl-9"
              aria-label="Search prompts"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-400">
            <ArrowDownWideNarrow className="h-4 w-4" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort prompts"
              className="rounded-xl border border-white/10 bg-surface-900/60 px-3 py-2 text-sm text-slate-200 focus:border-accent-400/60 focus:outline-none"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {visibleTags.length > 0 && (
          <div className="relative mt-4 flex flex-wrap items-center gap-2">
            <Tag className="h-3.5 w-3.5 text-slate-500" />
            {visibleTags.map(({ tag, count }) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                aria-pressed={tag === activeTag}
                className="focus:outline-none"
              >
                <Badge
                  tone={tag === activeTag ? 'accent' : 'neutral'}
                  className={cn('cursor-pointer transition hover:border-accent-400/40', tag === activeTag && 'shadow-glow')}
                >
                  #{tag}
                  <span className="text-slate-500">{count}</span>
                </Badge>
              </button>
            ))}
            {activeTag && (
              <button
                type="button"
                onClick={() => setActiveTag(null)}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"
              >
                <X className="h-3 w-3" /> clear
              </button>
            )}
          </div>
        )}
      </GlassCard>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          {status === 'loading' ? 'Loading…' : `${total} public prompt${total === 1 ? '' : 's'}`}
          {activeTag && (
            <>
              {' '}
              tagged <span className="text-accent-300">#{activeTag}</span>
            </>
          )}
          {debouncedSearch && (
            <>
              {' '}
              matching <span className="text-slate-300">“{debouncedSearch}”</span>
            </>
          )}
        </span>
      </div>

      {status === 'error' ? (
        <EmptyState icon={Compass} title="Couldn't load prompts">
          {error}
        </EmptyState>
      ) : status === 'ready' && items.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No prompts match"
          action={
            <Link to="/prompts/new" className="text-sm text-glow-400 hover:underline">
              Create the first one →
            </Link>
          }
        >
          Try a different search term or clear the tag filter.
        </EmptyState>
      ) : (
        <div className={cn('grid gap-4 md:grid-cols-2 xl:grid-cols-3', status === 'loading' && 'opacity-60')}>
          {status === 'loading' && items.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass h-56 animate-pulse" />
              ))
            : items.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  activeTag={activeTag}
                  onTagClick={toggleTag}
                  onLikeChange={handleLikeChange}
                />
              ))}
        </div>
      )}
    </div>
  )
}
