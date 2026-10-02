import { supabaseAdmin, supabaseForUser } from '../lib/supabase.js'

function bearerToken(req) {
  const header = req.headers.authorization ?? ''
  const [scheme, token] = header.split(' ')
  return scheme?.toLowerCase() === 'bearer' && token ? token : null
}

/**
 * Attaches `req.user` and an RLS-scoped `req.supabase` client when a valid
 * Supabase JWT is present. Does not reject anonymous requests.
 */
export async function optionalAuth(req, _res, next) {
  const token = bearerToken(req)
  if (!token || !supabaseAdmin) return next()

  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (!error && data?.user) {
    req.user = data.user
    req.supabase = supabaseForUser(token)
  }
  next()
}

/** Rejects the request with 401 unless `optionalAuth` resolved a user. */
export function requireAuth(req, res, next) {
  if (!req.user || !req.supabase) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  next()
}
