import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && (serviceRoleKey || anonKey))

if (!isSupabaseConfigured) {
  console.warn(
    '[supabase] Missing VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Copy server/.env.example to server/.env.',
  )
}

/**
 * Privileged client (service role) for trusted server-side operations.
 * Bypasses RLS — never send this key to the browser.
 */
export const supabaseAdmin = isSupabaseConfigured
  ? createClient(supabaseUrl, serviceRoleKey ?? anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null

/**
 * Builds a client scoped to the caller's JWT so RLS policies apply.
 * Use for requests that act on behalf of an authenticated user.
 */
export function supabaseForUser(accessToken) {
  if (!isSupabaseConfigured || !anonKey) return null
  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
