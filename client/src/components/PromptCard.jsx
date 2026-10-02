import { Link } from 'react-router-dom'
import { Braces, Lock } from 'lucide-react'
import Badge from './Badge'
import LikeButton from './LikeButton'
import { extractVariables } from '../lib/template'

export default function PromptCard({ prompt, activeTag, onTagClick, onLikeChange }) {
  const variables = extractVariables(prompt.template_text)

  return (
    <Link
      to={`/prompts/${prompt.id}`}
      className="glass glass-hover group flex h-full flex-col gap-3 p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/60"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-white group-hover:text-gradient">{prompt.title}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            by {prompt.profiles?.username ?? 'anonymous'}
            {!prompt.is_public && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-300">
                <Lock className="h-3 w-3" /> private
              </span>
            )}
          </p>
        </div>
        <LikeButton
          promptId={prompt.id}
          liked={prompt.liked_by_me}
          count={prompt.likes_count}
          onChange={(next) => onLikeChange?.(prompt.id, next)}
        />
      </div>

      {prompt.description && <p className="line-clamp-2 text-sm text-slate-400">{prompt.description}</p>}

      <pre className="line-clamp-3 whitespace-pre-wrap rounded-xl bg-surface-950/60 p-3 font-mono text-xs leading-relaxed text-slate-400">
        {prompt.template_text}
      </pre>

      <div className="mt-auto flex flex-wrap items-center gap-1.5">
        {prompt.tags?.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onTagClick?.(tag)
            }}
            className="focus:outline-none"
          >
            <Badge tone={tag === activeTag ? 'accent' : 'neutral'} className="hover:border-accent-400/40">
              #{tag}
            </Badge>
          </button>
        ))}
        {variables.length > 0 && (
          <Badge className="ml-auto text-slate-400">
            <Braces className="h-3 w-3" /> {variables.length} var{variables.length === 1 ? '' : 's'}
          </Badge>
        )}
      </div>
    </Link>
  )
}
