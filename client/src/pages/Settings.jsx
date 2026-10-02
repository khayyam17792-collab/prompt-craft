import { KeyRound, Palette } from 'lucide-react'
import GlassCard from '../components/GlassCard'

export default function Settings() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <GlassCard>
        <div className="flex items-center gap-3">
          <Palette className="h-5 w-5 text-accent-400" />
          <h2 className="font-semibold text-white">Appearance</h2>
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Dark glassmorphic theme is enabled by default. Theme tokens live in{' '}
          <code className="font-mono text-slate-300">src/index.css</code>.
        </p>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-3">
          <KeyRound className="h-5 w-5 text-glow-400" />
          <h2 className="font-semibold text-white">Supabase keys</h2>
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Copy <code className="font-mono text-slate-300">.env.example</code> to{' '}
          <code className="font-mono text-slate-300">.env</code> in both{' '}
          <code className="font-mono text-slate-300">client/</code> and{' '}
          <code className="font-mono text-slate-300">server/</code>.
        </p>
      </GlassCard>
    </div>
  )
}
