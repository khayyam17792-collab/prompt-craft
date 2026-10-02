import { cn } from '../lib/cn'

const tones = {
  neutral: 'border-white/10 bg-white/5 text-slate-300',
  accent: 'border-accent-400/30 bg-accent-500/15 text-accent-300',
  success: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  warning: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
}

export default function Badge({ tone = 'neutral', className, children, ...props }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium', tones[tone], className)}
      {...props}
    >
      {children}
    </span>
  )
}
