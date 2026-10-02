import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

function titleFor(pathname) {
  if (pathname === '/') return 'Prompt Explorer'
  if (pathname === '/prompts/new') return 'New Prompt'
  if (pathname.startsWith('/prompts/')) return 'Playground'
  if (pathname === '/library') return 'My Prompts'
  if (pathname === '/settings') return 'Settings'
  return 'PromptCraft Studio'
}

export default function AppLayout() {
  const { pathname } = useLocation()

  return (
    <div className="flex h-screen gap-4 p-4">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <Header title={titleFor(pathname)} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
