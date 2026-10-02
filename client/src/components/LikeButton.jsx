import { useState } from 'react'
import { Heart } from 'lucide-react'
import { cn } from '../lib/cn'
import { prompts as promptsApi } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

export default function LikeButton({ promptId, liked, count, onChange, className }) {
  const { user, authModal } = useAuth()
  const [busy, setBusy] = useState(false)

  async function toggle(event) {
    event.preventDefault()
    event.stopPropagation()
    if (!user) return authModal.openAuth('login')
    if (busy) return
    setBusy(true)
    try {
      const { data } = await promptsApi.toggleLike(promptId)
      onChange?.({ liked: data.liked, likes_count: data.likes_count })
    } catch (err) {
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={liked}
      aria-label={liked ? 'Unlike prompt' : 'Like prompt'}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-200',
        liked
          ? 'border-rose-400/30 bg-rose-400/15 text-rose-300'
          : 'border-white/10 bg-white/5 text-slate-300 hover:border-rose-400/30 hover:text-rose-300',
        busy && 'opacity-60',
        className,
      )}
    >
      <Heart className={cn('h-3.5 w-3.5', liked && 'fill-current')} />
      {count}
    </button>
  )
}
