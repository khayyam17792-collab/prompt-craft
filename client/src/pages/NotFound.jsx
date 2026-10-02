import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import GlassCard from '../components/GlassCard'

export default function NotFound() {
  return (
    <GlassCard className="flex flex-col items-center gap-3 py-20 text-center">
      <Compass className="h-8 w-8 text-accent-400" />
      <h2 className="text-xl font-semibold text-white">Page not found</h2>
      <Link to="/" className="text-sm text-glow-400 hover:underline">
        Back to dashboard
      </Link>
    </GlassCard>
  )
}
