import { cn } from '../lib/cn'

const variants = {
  primary:
    'bg-gradient-to-r from-accent-600 to-glow-500 text-white shadow-glow hover:brightness-110',
  ghost: 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:border-white/20',
  subtle: 'text-slate-300 hover:text-white hover:bg-white/5',
}

export default function Button({ variant = 'primary', className, children, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium',
        'transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/60',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
