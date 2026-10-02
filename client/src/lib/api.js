import { supabase } from './supabase'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function accessToken() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

/** Fetch wrapper for the Express API. Attaches the Supabase JWT when signed in. */
export async function api(path, { method = 'GET', body, signal } = {}) {
  const token = await accessToken()
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  })

  if (res.status === 204) return null

  const payload = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(payload.error ?? res.statusText, res.status)
  return payload
}

export const prompts = {
  list: (params = {}, signal) => {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
    }
    const qs = search.toString()
    return api(`/prompts${qs ? `?${qs}` : ''}`, { signal })
  },
  tags: (signal) => api('/prompts/tags', { signal }),
  get: (id, signal) => api(`/prompts/${id}`, { signal }),
  mine: (signal) => api('/me/prompts?limit=100', { signal }),
  create: (fields) => api('/prompts', { method: 'POST', body: fields }),
  update: (id, fields) => api(`/prompts/${id}`, { method: 'PATCH', body: fields }),
  remove: (id) => api(`/prompts/${id}`, { method: 'DELETE' }),
  toggleLike: (id) => api(`/prompts/${id}/like`, { method: 'POST' }),
}

export const me = {
  get: (signal) => api('/me', { signal }),
  update: (fields) => api('/me', { method: 'PATCH', body: fields }),
}
