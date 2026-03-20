import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import { X, FileUp, Loader2, AlertCircle } from 'lucide-react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { docsApi, connectAnalysisWS } from '@/services/api'
import { useDocuments } from '@/stores/documents'
import { playSound } from '@/services/audio'
import AnalysisAnimation from '@/components/nexus/AnalysisAnimation'

interface Props {
  open: boolean
  onClose: () => void
}

const stepLabels: Record<string, string> = {
  parsing: 'upload.parsing',
  analyzing: 'upload.ai_analysis',
  embeddings: 'upload.embeddings',
  timeline: 'upload.timeline',
  connections: 'upload.connections',
  done: 'upload.done',
}

export default function UploadModal({ open, onClose }: Props) {
  const { t } = useTranslation()
  const { fetchDocuments, fetchGraph, setAnalysisProgress } = useDocuments()
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<{ step: string; pct: number } | null>(null)
  const [uploadError, setUploadError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    return () => {
      wsRef.current?.close()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleFile = useCallback(async (file: File) => {
    setUploading(true)
    setProgress({ step: 'parsing', pct: 0 })
    setUploadError('')

    try {
      const { data: doc } = await docsApi.upload(file)

      // WS timeout — if no "done" in 120s, assume it completed
      timeoutRef.current = setTimeout(async () => {
        wsRef.current?.close()
        await fetchDocuments()
        await fetchGraph()
        setUploading(false)
        setProgress(null)
        playSound('complete')
        onClose()
      }, 120000)

      wsRef.current = connectAnalysisWS(doc.id, (msg) => {
        setProgress({ step: msg.step, pct: msg.progress })
        setAnalysisProgress(msg)

        if (msg.step === 'done') {
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          wsRef.current?.close()
          playSound('complete')
          setTimeout(async () => {
            await fetchDocuments()
            await fetchGraph()
            setUploading(false)
            setProgress(null)
            setAnalysisProgress(null)
            onClose()
          }, 500)
        }
      })
    } catch {
      setUploading(false)
      setProgress(null)
      setUploadError(t('common.error'))
    }
  }, [fetchDocuments, fetchGraph, onClose, setAnalysisProgress, t])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={!uploading ? onClose : undefined}>

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-modal-title"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="glass w-full max-w-lg mx-4 p-6 relative"
            onClick={(e) => e.stopPropagation()}>

            {!uploading && (
              <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full btn-ghost">
                <X size={18} style={{ color: 'var(--color-text-muted)' }} />
              </button>
            )}

            <h2 id="upload-modal-title" className="text-xl font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              {t('upload.title')}
            </h2>

            {!uploading ? (
              <>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => inputRef.current?.click()}
                  className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200"
                  style={{
                    borderColor: dragging ? 'var(--color-accent)' : 'var(--color-border)',
                    background: dragging ? 'rgba(109,92,255,0.08)' : 'transparent',
                  }}>
                  <FileUp size={40} className="mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
                  <p style={{ color: 'var(--color-text-secondary)' }} className="mb-1">{t('upload.drag')}</p>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {t('upload.or')} <span className="underline">{t('upload.browse')}</span>
                  </p>
                  <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>{t('upload.formats')}</p>
                  <input ref={inputRef} type="file" accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.tiff,.tif"
                    onChange={onSelect} className="hidden" />
                </div>

                {uploadError && (
                  <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(239,68,68,0.1)' }}>
                    <AlertCircle size={14} style={{ color: 'var(--color-severity-critical)' }} />
                    <span className="text-sm" style={{ color: 'var(--color-severity-critical)' }}>{uploadError}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="py-2">
                <div className="w-full h-48 rounded-xl overflow-hidden mb-4"
                  style={{ background: 'var(--color-surface-0)' }}>
                  <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
                    <ambientLight intensity={0.2} />
                    <AnalysisAnimation progress={progress?.pct ?? 0} />
                    <EffectComposer>
                      <Bloom intensity={1.2} luminanceThreshold={0.2} mipmapBlur />
                    </EffectComposer>
                  </Canvas>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <Loader2 size={16} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {t(stepLabels[progress?.step ?? 'parsing'] ?? 'upload.analyzing')}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'var(--color-fill-subtle)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'var(--color-accent)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress?.pct ?? 0}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-right text-xs mt-1" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {progress?.pct ?? 0}%
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
