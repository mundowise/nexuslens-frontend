import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/stores/auth'
import { useApp } from '@/stores/app'
import { useDocuments } from '@/stores/documents'
import { usePageTransition } from '@/hooks/useTransition'
import Layout from '@/components/shared/Layout'
import AuthPage from '@/components/shared/AuthPage'
import SplashScreen from '@/components/shared/SplashScreen'
import type { AppMode } from '@/types'

const NexusView = lazy(() => import('@/components/nexus/NexusView'))
const LensView = lazy(() => import('@/components/lens/LensView'))
const TimelineView = lazy(() => import('@/components/timeline/TimelineView'))

function ModeFallback() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-6 h-6 border-2 rounded-full animate-spin"
        style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
    </div>
  )
}

const modeComponents: Record<AppMode, React.LazyExoticComponent<React.ComponentType>> = {
  nexus: NexusView,
  lens: LensView,
  timeline: TimelineView,
}

function ModeSync() {
  const { mode, setMode } = useApp()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)

  usePageTransition(containerRef, mode)

  useEffect(() => {
    const path = `/${mode}`
    if (window.location.pathname !== path) {
      navigate(path, { replace: true })
    }
  }, [mode, navigate])

  const ActiveView = modeComponents[mode]

  return (
    <div ref={containerRef} className="flex-1 flex flex-col">
      <Suspense fallback={<ModeFallback />}>
        <ActiveView />
      </Suspense>
    </div>
  )
}

function ModeFromUrl() {
  const { mode } = useParams<{ mode: string }>()
  const { setMode } = useApp()

  useEffect(() => {
    if (mode === 'nexus' || mode === 'lens' || mode === 'timeline') {
      setMode(mode)
    }
  }, [mode, setMode])

  return <ModeSync />
}

function AuthenticatedApp() {
  const { fetchDocuments } = useDocuments()

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  return (
    <Layout>
      <Routes>
        <Route path="/:mode" element={<ModeFromUrl />} />
        <Route path="*" element={<Navigate to="/nexus" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  const { user, loading, init } = useAuth()
  const [splashDone, setSplashDone] = useState(false)

  useEffect(() => { init() }, [init])

  if (!splashDone) {
    return <SplashScreen onDone={() => setSplashDone(true)} />
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <BrowserRouter>
      {user ? <AuthenticatedApp /> : <AuthPage />}
    </BrowserRouter>
  )
}
