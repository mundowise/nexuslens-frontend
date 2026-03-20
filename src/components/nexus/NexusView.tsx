import { useEffect, useState, useCallback, useRef, Component, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import Logo from '@/components/shared/Logo'
import { useDocuments } from '@/stores/documents'
import { useApp } from '@/stores/app'
import { playSound } from '@/services/audio'
import { docsApi, connectAnalysisWS } from '@/services/api'
import { getCategoryColor } from '@/lib/utils'
import NexusScene from './NexusScene'
import NexusFallback from './NexusFallback'
import { DocumentPanel, ConnectionPanel } from './NexusPanel'
import { Link2, X } from 'lucide-react'
import { cn, getSeverityClass } from '@/lib/utils'
import type { GraphNode, Connection } from '@/types'

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('webgl2') || canvas.getContext('webgl')
    return ctx !== null
  } catch {
    return false
  }
}

interface ErrorBoundaryState { hasError: boolean }

class WebGLErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

export default function NexusView() {
  const { t } = useTranslation()
  const { graph, documents, connections, fetchGraph, fetchDocument, fetchConnections, fetchDocuments,
    current, clearCurrent, setAnalysisProgress, error } = useDocuments()
  const { setMode } = useApp()
  const [selectedConn, setSelectedConn] = useState<Connection | null>(null)
  const [showConnList, setShowConnList] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [webglAvailable] = useState(detectWebGL)
  const [burst, setBurst] = useState<{ color: string; key: number } | null>(null)
  const prevDocCount = useRef(documents.length)

  useEffect(() => {
    fetchGraph()
    fetchConnections()
  }, [fetchGraph, fetchConnections])

  useEffect(() => {
    if (documents.length > prevDocCount.current && documents.length > 0) {
      const latest = documents[documents.length - 1]
      const color = getCategoryColor(latest.category)
      setBurst({ color, key: Date.now() })
    }
    prevDocCount.current = documents.length
  }, [documents.length, documents])

  const handleBurstComplete = useCallback(() => {
    setBurst(null)
  }, [])

  const handleNodeClick = useCallback((node: GraphNode) => {
    playSound('node-select')
    setSelectedConn(null)
    if (node.node_type === 'document') {
      fetchDocument(node.id)
    } else if (node.parent_id) {
      fetchDocument(node.parent_id)
    }
  }, [fetchDocument])

  const handleDoubleClick = useCallback((node: GraphNode) => {
    const docId = node.node_type === 'document' ? node.id : node.parent_id
    if (docId) {
      fetchDocument(docId)
      setMode('lens')
    }
  }, [fetchDocument, setMode])

  const handleEdgeClick = useCallback((edgeId: string) => {
    const conn = connections.find((c) => c.id === edgeId)
    if (conn) {
      playSound('node-select')
      setSelectedConn(conn)
      clearCurrent()
    }
  }, [connections, clearCurrent])

  const goToLens = useCallback(() => {
    if (current) setMode('lens')
  }, [current, setMode])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (!file) return

    try {
      const { data: doc } = await docsApi.upload(file)
      connectAnalysisWS(doc.id, (msg) => {
        setAnalysisProgress(msg)
        if (msg.step === 'done') {
          playSound('complete')
          setAnalysisProgress(null)
          fetchDocuments()
          fetchGraph()
        }
      })
    } catch {
      // upload failed silently in 3D context
    }
  }, [fetchDocuments, fetchGraph, setAnalysisProgress])

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="glass p-6 text-center">
          <p className="text-sm mb-2" style={{ color: 'var(--color-severity-critical)' }}>{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm underline"
            style={{ color: 'var(--color-accent)' }}>{t('common.retry')}</button>
        </div>
      </div>
    )
  }

  if (!graph || documents.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4"
        style={{ color: 'var(--color-text-muted)' }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-3">
          <Logo size={64} />
          <p className="text-sm">
            {dragOver ? t('upload.drag') : t('nexus.no_documents')}
          </p>
        </motion.div>
      </div>
    )
  }

  const docCount = graph.nodes.filter((n) => n.node_type === 'document').length
  const edgeCount = graph.edges.length

  const sceneContent = webglAvailable ? (
    <WebGLErrorBoundary fallback={
      <NexusFallback graph={graph} onNodeClick={handleNodeClick} onNodeDoubleClick={handleDoubleClick} />
    }>
      <NexusScene
        graph={graph}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleDoubleClick}
        onEdgeClick={handleEdgeClick}
        burst={burst}
        onBurstComplete={handleBurstComplete}
      />
    </WebGLErrorBoundary>
  ) : (
    <NexusFallback graph={graph} onNodeClick={handleNodeClick} onNodeDoubleClick={handleDoubleClick} />
  )

  return (
    <div className="flex-1 relative"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}>

      {dragOver && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
          style={{ background: 'rgba(109, 92, 255, 0.08)', border: '2px dashed var(--color-accent)' }}>
          <p className="text-lg font-medium" style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}>
            {t('upload.drag')}
          </p>
        </div>
      )}

      {sceneContent}

      <DocumentPanel doc={current} onClose={clearCurrent} onAnalyze={goToLens} />
      <ConnectionPanel connection={selectedConn} onClose={() => setSelectedConn(null)} />

      <button onClick={() => setShowConnList(!showConnList)}
        className="absolute bottom-6 left-6 glass px-4 py-2 text-xs flex items-center gap-2 cursor-pointer transition-all"
        style={{ color: edgeCount > 0 ? 'var(--color-accent)' : 'var(--color-text-muted)', zIndex: 10 }}>
        <Link2 size={12} />
        {docCount} {t('common.documents')} &middot; {edgeCount} {t('nexus.connections')}
      </button>

      {showConnList && connections.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-16 left-6 w-96 max-h-80 overflow-y-auto glass p-4"
          style={{ zIndex: 20 }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
              {t('nexus.connections')} ({connections.length})
            </h3>
            <button onClick={() => setShowConnList(false)} className="p-1 rounded btn-ghost">
              <X size={14} style={{ color: 'var(--color-text-muted)' }} />
            </button>
          </div>
          <div className="space-y-2">
            {connections.map((c) => (
              <div key={c.id}
                className={cn('glass p-3 cursor-pointer text-xs', getSeverityClass(c.severity ?? 'info'))}
                onClick={() => { setSelectedConn(c); setShowConnList(false) }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--color-fill-subtle)', color: 'var(--color-accent)', fontSize: '10px' }}>
                    {c.relationship_type}
                  </span>
                  {c.strength != null && (
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                      {Math.round(c.strength * 100)}%
                    </span>
                  )}
                </div>
                <p className="font-medium mb-0.5" style={{ color: 'var(--color-text-primary)' }}>
                  {c.source_document_name} ↔ {c.target_document_name}
                </p>
                {c.human_explanation && (
                  <p style={{ color: 'var(--color-text-secondary)' }}>{c.human_explanation}</p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="absolute bottom-6 right-6 glass px-4 py-2 text-xs"
        style={{ color: 'var(--color-text-muted)', zIndex: 10 }}>
        {t('nexus.double_click')}
      </div>
    </div>
  )
}
