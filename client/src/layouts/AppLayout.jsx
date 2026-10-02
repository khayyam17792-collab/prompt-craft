import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

const titles = {
  '/': 'Dashboard',
  '/library': 'Prompt Library',
  '/settings': 'Settings',
}

export default function AppLayout() {
  const { pathname } = useLocation()
  const title = titles[pathname] ?? 'PromptCraft Studio'

  return (
    <div className="flex h-screen gap-4 p-4">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <Header title={title} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
