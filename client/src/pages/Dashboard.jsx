import { useEffect, useState } from 'react'
import { Database, Server, Wand2, Zap } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import Button from '../components/Button'
import { isSupabaseConfigured } from '../lib/supabase'

function StatusPill({ ok, label }) {
  return (
    <span
      className={
        ok
          ? 'rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-medium text-emerald-300'
          : 'rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-medium text-amber-300'
      }
    >
      {label}
    </span>
  )
}

export default function Dashboard() {
  const [apiStatus, setApiStatus] = useState('checking')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => (res.ok ? setApiStatus('online') : setApiStatus('offline')))
      .catch(() => setApiStatus('offline'))
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <GlassCard className="relative overflow-hidden p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-glow-500/20 blur-3xl" />
        <p className="text-sm font-medium uppercase tracking-widest text-accent-400">Welcome</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
          Craft, test, and ship <span className="text-gradient">better prompts</span>.
        </h2>
        <p className="mt-3 max-w-xl text-slate-400">
          PromptCraft Studio is your workspace for designing, versioning, and evaluating prompts.
          This is the UI base — start building features on top of it.
        </p>
        <div className="mt-6 flex gap-3">
          <Button>
            <Wand2 className="h-4 w-4" />
            New prompt
          </Button>
          <Button variant="ghost">
            <Zap className="h-4 w-4" />
            Quick test
          </Button>
        </div>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard hover className="flex items-start gap-4">
          <span className="rounded-xl bg-white/5 p-3 text-glow-400">
            <Server className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">API server</h3>
              <StatusPill
                ok={apiStatus === 'online'}
                label={apiStatus === 'checking' ? 'Checking…' : apiStatus}
              />
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Express server proxied at <code className="font-mono text-slate-300">/api</code>.
            </p>
          </div>
        </GlassCard>

        <GlassCard hover className="flex items-start gap-4">
          <span className="rounded-xl bg-white/5 p-3 text-accent-400">
            <Database className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Supabase</h3>
              <StatusPill
                ok={isSupabaseConfigured}
                label={isSupabaseConfigured ? 'configured' : 'not configured'}
              />
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Set <code className="font-mono text-slate-300">VITE_SUPABASE_URL</code> and{' '}
              <code className="font-mono text-slate-300">VITE_SUPABASE_ANON_KEY</code> in{' '}
              <code className="font-mono text-slate-300">client/.env</code>.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
