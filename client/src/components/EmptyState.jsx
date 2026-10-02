import GlassCard from './GlassCard'

export default function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <GlassCard className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {Icon && (
        <span className="rounded-2xl bg-white/5 p-4 text-accent-400">
          <Icon className="h-8 w-8" />
        </span>
      )}
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {children && <p className="max-w-md text-sm text-slate-400">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </GlassCard>
  )
}
