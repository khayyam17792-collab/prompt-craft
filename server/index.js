import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { supabaseAdmin, isSupabaseConfigured } from './lib/supabase.js'
import { optionalAuth, requireAuth } from './middleware/auth.js'

const app = express()
const port = Number(process.env.PORT ?? 4000)

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  }),
)
app.use(express.json({ limit: '1mb' }))
app.use(optionalAuth)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PROMPT_COLUMNS =
  'id, user_id, title, description, template_text, variables, tags, likes_count, is_public, created_at, profiles ( username, avatar_url )'

const SORTS = {
  newest: { column: 'created_at', ascending: false },
  oldest: { column: 'created_at', ascending: true },
  popular: { column: 'likes_count', ascending: false },
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function requireSupabase(_req, res, next) {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return res.status(503).json({
      error: 'Supabase is not configured. Copy server/.env.example to server/.env and set the keys.',
    })
  }
  next()
}

function validateUuid(param) {
  return (req, res, next) => {
    if (!UUID_RE.test(req.params[param])) {
      return res.status(400).json({ error: `Invalid ${param}` })
    }
    next()
  }
}

function parsePagination(query) {
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100)
  const offset = Math.max(Number.parseInt(query.offset, 10) || 0, 0)
  return { limit, offset, from: offset, to: offset + limit - 1 }
}

function sendSupabaseError(res, error) {
  if (error.code === 'PGRST116') return res.status(404).json({ error: 'Prompt not found' })
  if (error.code === '42501') return res.status(403).json({ error: 'Forbidden' })
  if (error.code === '23514' || error.code === '22P02') {
    return res.status(400).json({ error: error.message })
  }
  console.error(error)
  return res.status(500).json({ error: error.message ?? 'Database error' })
}

/** Whitelists and lightly validates writable prompt fields from a request body. */
function pickPromptFields(body, { partial = false } = {}) {
  const out = {}
  const errors = []

  if (!partial || body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) errors.push('title is required')
    else out.title = body.title.trim()
  }
  if (!partial || body.template_text !== undefined) {
    if (typeof body.template_text !== 'string' || !body.template_text.trim()) {
      errors.push('template_text is required')
    } else out.template_text = body.template_text
  }
  if (body.description !== undefined) {
    if (body.description !== null && typeof body.description !== 'string') {
      errors.push('description must be a string')
    } else out.description = body.description
  }
  if (body.variables !== undefined) {
    if (!Array.isArray(body.variables)) errors.push('variables must be an array')
    else out.variables = body.variables
  }
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags) || !body.tags.every((t) => typeof t === 'string')) {
      errors.push('tags must be an array of strings')
    } else out.tags = body.tags.map((t) => t.trim().toLowerCase()).filter(Boolean)
  }
  if (body.is_public !== undefined) {
    if (typeof body.is_public !== 'boolean') errors.push('is_public must be a boolean')
    else out.is_public = body.is_public
  }

  return { fields: out, errors }
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'promptcraft-studio-server',
    supabase: isSupabaseConfigured ? 'configured' : 'not configured',
    timestamp: new Date().toISOString(),
  })
})

// ---------------------------------------------------------------------------
// Public prompt queries
// ---------------------------------------------------------------------------

/**
 * GET /api/prompts
 * Query: q (search title/description), tag, sort (newest|oldest|popular), limit, offset
 */
app.get('/api/prompts', requireSupabase, async (req, res) => {
  const { q, tag, sort = 'newest' } = req.query
  const { limit, offset, from, to } = parsePagination(req.query)
  const order = SORTS[sort] ?? SORTS.newest

  let query = supabaseAdmin
    .from('prompts')
    .select(PROMPT_COLUMNS, { count: 'exact' })
    .eq('is_public', true)
    .order(order.column, { ascending: order.ascending })
    .range(from, to)

  if (typeof q === 'string' && q.trim()) {
    const term = q.trim().replace(/[%,()]/g, ' ')
    query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`)
  }
  if (typeof tag === 'string' && tag.trim()) {
    query = query.contains('tags', [tag.trim().toLowerCase()])
  }

  const { data, error, count } = await query
  if (error) return sendSupabaseError(res, error)

  res.json({ data, pagination: { limit, offset, total: count ?? data.length } })
})

/** GET /api/prompts/tags — distinct tags across public prompts with counts */
app.get('/api/prompts/tags', requireSupabase, async (_req, res) => {
  const { data, error } = await supabaseAdmin.from('prompts').select('tags').eq('is_public', true)
  if (error) return sendSupabaseError(res, error)

  const counts = new Map()
  for (const row of data) for (const tag of row.tags ?? []) counts.set(tag, (counts.get(tag) ?? 0) + 1)

  res.json({
    data: [...counts.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag)),
  })
})

/** GET /api/prompts/:id — public prompt, or any prompt owned by the caller */
app.get('/api/prompts/:id', requireSupabase, validateUuid('id'), async (req, res) => {
  const client = req.supabase ?? supabaseAdmin
  let query = client.from('prompts').select(PROMPT_COLUMNS).eq('id', req.params.id)
  if (!req.supabase) query = query.eq('is_public', true)

  const { data, error } = await query.single()
  if (error) return sendSupabaseError(res, error)
  res.json({ data })
})

// ---------------------------------------------------------------------------
// Public profiles
// ---------------------------------------------------------------------------

/** GET /api/profiles/:username — profile with their public prompts */
app.get('/api/profiles/:username', requireSupabase, async (req, res) => {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('id, username, avatar_url, created_at')
    .eq('username', req.params.username)
    .maybeSingle()
  if (error) return sendSupabaseError(res, error)
  if (!profile) return res.status(404).json({ error: 'Profile not found' })

  const { data: prompts, error: promptsError } = await supabaseAdmin
    .from('prompts')
    .select(PROMPT_COLUMNS)
    .eq('user_id', profile.id)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
  if (promptsError) return sendSupabaseError(res, promptsError)

  res.json({ data: { ...profile, prompts } })
})

// ---------------------------------------------------------------------------
// Authenticated user routes (RLS enforced via req.supabase)
// ---------------------------------------------------------------------------

/** GET /api/me — the caller's profile */
app.get('/api/me', requireSupabase, requireAuth, async (req, res) => {
  const { data, error } = await req.supabase
    .from('profiles')
    .select('id, username, avatar_url, created_at')
    .eq('id', req.user.id)
    .maybeSingle()
  if (error) return sendSupabaseError(res, error)
  res.json({ data: { email: req.user.email, ...(data ?? { id: req.user.id }) } })
})

/** PATCH /api/me — update username / avatar_url */
app.patch('/api/me', requireSupabase, requireAuth, async (req, res) => {
  const fields = {}
  if (req.body.username !== undefined) {
    if (typeof req.body.username !== 'string' || !/^[a-z0-9_]{3,32}$/i.test(req.body.username)) {
      return res.status(400).json({ error: 'username must be 3–32 letters, numbers, or underscores' })
    }
    fields.username = req.body.username
  }
  if (req.body.avatar_url !== undefined) {
    if (req.body.avatar_url !== null && typeof req.body.avatar_url !== 'string') {
      return res.status(400).json({ error: 'avatar_url must be a string' })
    }
    fields.avatar_url = req.body.avatar_url
  }
  if (Object.keys(fields).length === 0) return res.status(400).json({ error: 'Nothing to update' })

  const { data, error } = await req.supabase
    .from('profiles')
    .upsert({ id: req.user.id, ...fields })
    .select('id, username, avatar_url, created_at')
    .single()
  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Username already taken' })
    return sendSupabaseError(res, error)
  }
  res.json({ data })
})

/** GET /api/me/prompts — all of the caller's prompts, including private ones */
app.get('/api/me/prompts', requireSupabase, requireAuth, async (req, res) => {
  const { limit, offset, from, to } = parsePagination(req.query)
  const { data, error, count } = await req.supabase
    .from('prompts')
    .select(PROMPT_COLUMNS, { count: 'exact' })
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .range(from, to)
  if (error) return sendSupabaseError(res, error)
  res.json({ data, pagination: { limit, offset, total: count ?? data.length } })
})

/** POST /api/prompts — create a prompt owned by the caller */
app.post('/api/prompts', requireSupabase, requireAuth, async (req, res) => {
  const { fields, errors } = pickPromptFields(req.body ?? {})
  if (errors.length) return res.status(400).json({ error: errors.join('; ') })

  const { data, error } = await req.supabase
    .from('prompts')
    .insert({ ...fields, user_id: req.user.id })
    .select(PROMPT_COLUMNS)
    .single()
  if (error) return sendSupabaseError(res, error)
  res.status(201).json({ data })
})

/** PATCH /api/prompts/:id — update a prompt (owner only, enforced by RLS) */
app.patch('/api/prompts/:id', requireSupabase, requireAuth, validateUuid('id'), async (req, res) => {
  const { fields, errors } = pickPromptFields(req.body ?? {}, { partial: true })
  if (errors.length) return res.status(400).json({ error: errors.join('; ') })
  if (Object.keys(fields).length === 0) return res.status(400).json({ error: 'Nothing to update' })

  const { data, error } = await req.supabase
    .from('prompts')
    .update(fields)
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select(PROMPT_COLUMNS)
    .maybeSingle()
  if (error) return sendSupabaseError(res, error)
  if (!data) return res.status(404).json({ error: 'Prompt not found or not owned by you' })
  res.json({ data })
})

/** DELETE /api/prompts/:id — delete a prompt (owner only, enforced by RLS) */
app.delete('/api/prompts/:id', requireSupabase, requireAuth, validateUuid('id'), async (req, res) => {
  const { data, error } = await req.supabase
    .from('prompts')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select('id')
    .maybeSingle()
  if (error) return sendSupabaseError(res, error)
  if (!data) return res.status(404).json({ error: 'Prompt not found or not owned by you' })
  res.status(204).end()
})

/** POST /api/prompts/:id/like — increment likes on a public prompt */
app.post('/api/prompts/:id/like', requireSupabase, requireAuth, validateUuid('id'), async (req, res) => {
  const { data, error } = await req.supabase.rpc('increment_prompt_likes', {
    prompt_id: req.params.id,
  })
  if (error) {
    if (error.code === 'P0002') return res.status(404).json({ error: 'Prompt not found' })
    return sendSupabaseError(res, error)
  }
  res.json({ data: { id: req.params.id, likes_count: data } })
})

// ---------------------------------------------------------------------------
// Fallbacks
// ---------------------------------------------------------------------------

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' })
  console.error(err)
  res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' })
})

app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`)
})

export default app
