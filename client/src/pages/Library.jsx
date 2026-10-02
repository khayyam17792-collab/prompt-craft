import { FolderOpen } from 'lucide-react'
import GlassCard from '../components/GlassCard'

export default function Library() {
  return (
    <GlassCard className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <span className="rounded-2xl bg-white/5 p-4 text-accent-400">
        <FolderOpen className="h-8 w-8" />
      </span>
      <h2 className="text-xl font-semibold text-white">Your prompt library is empty</h2>
      <p className="max-w-sm text-sm text-slate-400">
        Prompts you create will show up here. Connect Supabase to persist them.
      </p>
    </GlassCard>
  )
}
