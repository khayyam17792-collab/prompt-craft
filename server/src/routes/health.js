import { Router } from 'express'
import { isSupabaseConfigured } from '../lib/supabase.js'

const router = Router()

router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'promptcraft-studio-server',
    supabase: isSupabaseConfigured ? 'configured' : 'not configured',
    timestamp: new Date().toISOString(),
  })
})

export default router
