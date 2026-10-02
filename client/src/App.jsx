import { Route, Routes, useParams } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import Explorer from './pages/Explorer'
import Playground from './pages/Playground'
import Library from './pages/Library'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import AuthModal from './components/AuthModal'

function PlaygroundRoute() {
  const { id } = useParams()
  return <Playground key={id ?? 'new'} />
}

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Explorer />} />
          <Route path="prompts/new" element={<PlaygroundRoute />} />
          <Route path="prompts/:id" element={<PlaygroundRoute />} />
          <Route path="library" element={<Library />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <AuthModal />
    </>
  )
}
