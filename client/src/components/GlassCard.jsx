import { cn } from '../lib/cn'

export default function GlassCard({ className, children, hover = false, as: Tag = 'div', ...props }) {
  return (
    <Tag className={cn('glass p-6', hover && 'glass-hover', className)} {...props}>
      {children}
    </Tag>
  )
}
