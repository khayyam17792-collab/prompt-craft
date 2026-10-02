import { cn } from '../lib/cn'

const base =
  'w-full rounded-xl border border-white/10 bg-surface-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 transition focus:border-accent-400/60 focus:outline-none focus:ring-2 focus:ring-accent-400/30'

export function Input({ className, ...props }) {
  return <input className={cn(base, className)} {...props} />
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn(base, 'min-h-28 resize-y font-mono leading-relaxed', className)} {...props} />
}

export function Field({ label, hint, htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</span>
      {children}
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </label>
  )
}
