import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Braces,
  Check,
  Copy,
  Eye,
  EyeOff,
  Globe,
  Hash,
  Loader2,
  Lock,
  Pencil,
  Save,
  Trash2,
  Wand2,
} from 'lucide-react'
import GlassCard from '../components/GlassCard'
import Button from '../components/Button'
import Badge from '../components/Badge'
import LikeButton from '../components/LikeButton'
import EmptyState from '../components/EmptyState'
import { Field, Input, Textarea } from '../components/Input'
import { prompts as promptsApi, ApiError } from '../lib/api'
import { estimateTokens, extractVariables, mergeVariableMeta, renderTemplate } from '../lib/template'
import { useAuth } from '../hooks/useAuth'
import { cn } from '../lib/cn'

const STARTER_TEMPLATE = `You are an expert {{role}}.

Write a {{format}} about {{topic}} for {{audience}}. Keep it under {{word_limit}} words and use a {{tone}} tone.`

function parseTags(value) {
  return [...new Set(value.split(',').map((t) => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean))]
}

export default function Playground() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const { user, loading: authLoading, authModal } = useAuth()

  const [prompt, setPrompt] = useState(null)
  const [loaded, setLoaded] = useState(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [template, setTemplate] = useState(isNew ? STARTER_TEMPLATE : '')
  const [isPublic, setIsPublic] = useState(true)
  const [variableMeta, setVariableMeta] = useState([])
  const [values, setValues] = useState({})

  const [editing, setEditing] = useState(isNew)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showRaw, setShowRaw] = useState(false)

  const isOwner = Boolean(user && prompt && prompt.user_id === user.id)
  const canEdit = isNew || isOwner

  const applyPrompt = useCallback((data) => {
    setPrompt(data)
    setTitle(data.title)
    setDescription(data.description ?? '')
    setTagsInput((data.tags ?? []).join(', '))
    setTemplate(data.template_text)
    setIsPublic(data.is_public)
    setVariableMeta(Array.isArray(data.variables) ? data.variables : [])
    setValues(
      Object.fromEntries(
        (Array.isArray(data.variables) ? data.variables : [])
          .filter((v) => v.default !== undefined && v.default !== '')
          .map((v) => [v.name, String(v.default)]),
      ),
    )
  }, [])

  const userId = user?.id ?? null

  useEffect(() => {
    if (isNew || authLoading) return undefined

    const controller = new AbortController()
    promptsApi
      .get(id, controller.signal)
      .then(({ data }) => {
        applyPrompt(data)
        setEditing(false)
        setLoaded({ userId, error: '' })
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setLoaded({
          userId,
          error:
            err instanceof ApiError
              ? err.status === 404
                ? 'This prompt does not exist or is private.'
                : err.message
              : 'Could not reach the API server.',
        })
      })
    return () => controller.abort()
  }, [id, isNew, authLoading, userId, applyPrompt])

  const status = isNew
    ? 'ready'
    : authLoading || loaded?.userId !== userId
      ? 'loading'
      : loaded.error
        ? 'error'
        : 'ready'
  const loadError = loaded?.error ?? ''

  const variableNames = useMemo(() => extractVariables(template), [template])
  const variables = useMemo(() => mergeVariableMeta(variableNames, variableMeta), [variableNames, variableMeta])
  const rendered = useMemo(() => renderTemplate(template, values), [template, values])
  const tokens = useMemo(() => estimateTokens(rendered), [rendered])
  const unfilled = variableNames.filter((name) => !values[name])

  function setValue(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  function updateMeta(name, patch) {
    setVariableMeta((prev) => {
      const existing = prev.find((v) => v.name === name)
      if (existing) return prev.map((v) => (v.name === name ? { ...v, ...patch } : v))
      return [...prev, { name, description: '', default: '', ...patch }]
    })
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(rendered)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch (err) {
      console.error(err)
    }
  }

  function buildPayload() {
    return {
      title: title.trim(),
      description: description.trim() || null,
      template_text: template,
      tags: parseTags(tagsInput),
      is_public: isPublic,
      variables: variables.map((v) => ({
        name: v.name,
        description: v.description || '',
        default: v.default ?? '',
      })),
    }
  }

  async function handleSave(asCopy = false) {
    if (!user) return authModal.openAuth('login')
    setSaveError('')
    if (!title.trim()) return setSaveError('Give your prompt a title.')
    if (!template.trim()) return setSaveError('Template text cannot be empty.')

    setSaving(true)
    try {
      if (isNew || asCopy) {
        const { data } = await promptsApi.create(buildPayload())
        navigate(`/prompts/${data.id}`, { replace: isNew })
      } else {
        const { data } = await promptsApi.update(id, buildPayload())
        applyPrompt(data)
        setEditing(false)
      }
    } catch (err) {
      setSaveError(err.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this prompt? This cannot be undone.')) return
    setSaving(true)
    try {
      await promptsApi.remove(id)
      navigate('/library')
    } catch (err) {
      setSaveError(err.message ?? 'Failed to delete')
      setSaving(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass h-96 animate-pulse" />
        <div className="glass h-96 animate-pulse" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <EmptyState icon={Lock} title="Prompt unavailable" action={<Button onClick={() => navigate('/')}>Back to Explorer</Button>}>
        {loadError}
      </EmptyState>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Title bar */}
      <GlassCard className="flex flex-wrap items-start justify-between gap-4 p-5">
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="grid gap-3 md:grid-cols-[2fr_3fr]">
              <Field label="Title" htmlFor="prompt-title">
                <Input
                  id="prompt-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Blog Post Outline"
                  maxLength={200}
                />
              </Field>
              <Field label="Description" htmlFor="prompt-description">
                <Input
                  id="prompt-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this prompt do?"
                />
              </Field>
              <Field label="Tags" htmlFor="prompt-tags" hint="Comma-separated">
                <Input
                  id="prompt-tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="writing, marketing"
                />
              </Field>
              <Field label="Visibility">
                <div className="flex gap-2">
                  {[
                    { value: true, label: 'Public', icon: Globe },
                    { value: false, label: 'Private', icon: Lock },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setIsPublic(value)}
                      aria-pressed={isPublic === value}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition',
                        isPublic === value
                          ? 'border-accent-400/40 bg-accent-500/15 text-white'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:text-white',
                      )}
                    >
                      <Icon className="h-4 w-4" /> {label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
                {!isPublic && (
                  <Badge tone="warning">
                    <Lock className="h-3 w-3" /> private
                  </Badge>
                )}
              </div>
              {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>by {prompt?.profiles?.username ?? 'anonymous'}</span>
                {parseTags(tagsInput).map((tag) => (
                  <Badge key={tag}>#{tag}</Badge>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {prompt && (
            <LikeButton
              promptId={prompt.id}
              liked={prompt.liked_by_me}
              count={prompt.likes_count}
              onChange={(next) => setPrompt((p) => ({ ...p, ...next }))}
              className="px-3 py-2 text-sm"
            />
          )}
          {canEdit && !editing && (
            <Button variant="ghost" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          )}
          {canEdit && editing && (
            <>
              {!isNew && (
                <Button
                  variant="subtle"
                  onClick={() => {
                    applyPrompt(prompt)
                    setEditing(false)
                    setSaveError('')
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
              )}
              <Button onClick={() => handleSave(false)} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isNew ? 'Publish prompt' : 'Save changes'}
              </Button>
              {!isNew && (
                <Button variant="ghost" onClick={handleDelete} disabled={saving} className="text-rose-300">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
          {!canEdit && !isNew && (
            <Button variant="ghost" onClick={() => (user ? handleSave(true) : authModal.openAuth('login'))} disabled={saving}>
              <Copy className="h-4 w-4" /> {user ? 'Save a copy' : 'Sign in to save a copy'}
            </Button>
          )}
        </div>
      </GlassCard>

      {saveError && (
        <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">
          {saveError}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left: template + variables */}
        <div className="flex flex-col gap-4">
          <GlassCard className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold text-white">
                <Wand2 className="h-4 w-4 text-accent-400" /> Template
              </h3>
              <span className="text-xs text-slate-500">
                Use <code className="font-mono text-slate-300">{'{{variable_name}}'}</code> for inputs
              </span>
            </div>
            <Textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              readOnly={!canEdit && !isNew ? false : !editing}
              aria-label="Prompt template"
              className={cn('min-h-64', !editing && canEdit && 'opacity-80')}
              placeholder="Write your prompt template here…"
            />
            {!editing && canEdit && (
              <p className="text-xs text-slate-500">Click Edit to change the saved template.</p>
            )}
            {!canEdit && !isNew && (
              <p className="text-xs text-slate-500">
                You can experiment with the template here; changes aren't saved unless you save a copy.
              </p>
            )}
          </GlassCard>

          <GlassCard className="flex flex-col gap-3">
            <h3 className="flex items-center gap-2 font-semibold text-white">
              <Braces className="h-4 w-4 text-glow-400" /> Variables
              <Badge className="ml-1">{variables.length}</Badge>
            </h3>
            {variables.length === 0 ? (
              <p className="text-sm text-slate-500">
                No placeholders detected. Add <code className="font-mono">{'{{name}}'}</code> to the template to
                create an input.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {variables.map((variable) => (
                  <div key={variable.name} className="rounded-xl border border-white/5 bg-surface-900/40 p-3">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor={`var-${variable.name}`} className="flex items-center justify-between">
                        <span className="font-mono text-xs text-accent-300">{`{{${variable.name}}}`}</span>
                        {!values[variable.name] && <span className="text-[10px] uppercase tracking-wider text-amber-400/80">empty</span>}
                      </label>
                      <Input
                        id={`var-${variable.name}`}
                        value={values[variable.name] ?? ''}
                        onChange={(e) => setValue(variable.name, e.target.value)}
                        placeholder={variable.description || variable.default || `Value for ${variable.name}`}
                      />
                      {editing && canEdit && (
                        <div className="mt-1 grid gap-2 sm:grid-cols-2">
                          <Input
                            value={variable.description}
                            onChange={(e) => updateMeta(variable.name, { description: e.target.value })}
                            placeholder="Description (optional)"
                            className="text-xs"
                            aria-label={`Description for ${variable.name}`}
                          />
                          <Input
                            value={variable.default}
                            onChange={(e) => updateMeta(variable.name, { default: e.target.value })}
                            placeholder="Default value (optional)"
                            className="text-xs"
                            aria-label={`Default for ${variable.name}`}
                          />
                        </div>
                      )}
                      {!editing && variable.description && (
                        <p className="text-xs text-slate-500">{variable.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right: live preview */}
        <GlassCard className="flex flex-col gap-3 lg:sticky lg:top-0 lg:self-start">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 font-semibold text-white">
              <Eye className="h-4 w-4 text-glow-400" /> Live preview
            </h3>
            <div className="flex items-center gap-2">
              <Badge tone={unfilled.length ? 'warning' : 'success'}>
                <Hash className="h-3 w-3" /> ~{tokens.toLocaleString()} tokens
              </Badge>
              <Badge>{rendered.length.toLocaleString()} chars</Badge>
              <button
                type="button"
                onClick={() => setShowRaw((v) => !v)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-white/5 hover:text-white"
                aria-pressed={showRaw}
              >
                {showRaw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showRaw ? 'Rendered' : 'Highlight'}
              </button>
            </div>
          </div>

          <div className="min-h-64 flex-1 overflow-auto rounded-xl border border-white/5 bg-surface-950/70 p-4 font-mono text-sm leading-relaxed text-slate-200">
            {showRaw ? (
              <pre className="whitespace-pre-wrap">{rendered}</pre>
            ) : (
              <HighlightedPreview template={template} values={values} />
            )}
          </div>

          {unfilled.length > 0 && (
            <p className="text-xs text-amber-300/90">
              {unfilled.length} variable{unfilled.length === 1 ? '' : 's'} still empty: {unfilled.join(', ')}
            </p>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-slate-500">Token count is an estimate (~4 chars/token).</span>
            <Button onClick={copyToClipboard} variant={copied ? 'ghost' : 'primary'}>
              {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy to clipboard'}
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

/** Renders the template with filled variables highlighted and empty ones flagged. */
function HighlightedPreview({ template, values }) {
  const parts = template.split(/(\{\{\s*[a-zA-Z_][a-zA-Z0-9_]*\s*\}\})/g)
  return (
    <pre className="whitespace-pre-wrap">
      {parts.map((part, index) => {
        const match = part.match(/^\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}$/)
        if (!match) return <span key={index}>{part}</span>
        const name = match[1]
        const value = values[name]
        return value ? (
          <mark key={index} className="rounded bg-accent-500/25 px-1 text-accent-100">
            {value}
          </mark>
        ) : (
          <mark key={index} className="rounded border border-dashed border-amber-400/50 bg-transparent px-1 text-amber-300">
            {part}
          </mark>
        )
      })}
    </pre>
  )
}
