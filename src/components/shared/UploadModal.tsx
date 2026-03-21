import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import { X, FileUp, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { docsApi, pollAnalysisProgress } from '@/services/api'
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

interface FileProgress {
  name: string
  step: string
  pct: number
  status: 'pending' | 'uploading' | 'analyzing' | 'done' | 'error'
}

export default function UploadModal({ open, onClose }: Props) {
  const { t } = useTranslation()
  const { fetchDocuments, fetchGraph, setAnalysisProgress } = useDocuments()
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState<FileProgress[]>([])
  const [uploadError, setUploadError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const stopPollsRef = useRef<(() => void)[]>([])

  useEffect(() => {
    return () => {
      stopPollsRef.current.forEach(stop => stop())
    }
  }, [])

  const currentFile = files.find(f => f.status === 'uploading' || f.status === 'analyzing')
  const overallPct = files.length > 0
    ? Math.round(files.reduce((sum, f) => sum + (f.status === 'done' ? 100 : f.pct), 0) / files.length)
    : 0

  const handleFiles = useCallback(async (fileList: File[]) => {
    if (fileList.length === 0) return

    setUploading(true)
    setUploadError('')

    const fileProgresses: FileProgress[] = fileList.map(f => ({
      name: f.name,
      step: 'pending',
      pct: 0,
      status: 'pending',
    }))
    setFiles(fileProgresses)

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]

      // Update status to uploading
      setFiles(prev => prev.map((fp, idx) =>
        idx === i ? { ...fp, status: 'uploading', step: 'parsing', pct: 0 } : fp
      ))

      try {
        const { data: doc } = await docsApi.upload(file)

        // Update status to analyzing
        setFiles(prev => prev.map((fp, idx) =>
          idx === i ? { ...fp, status: 'analyzing', step: 'parsing', pct: 5 } : fp
        ))

        // Poll progress for this file
        await new Promise<void>((resolve) => {
          const stopPoll = pollAnalysisProgress(doc.id, (msg) => {
            setFiles(prev => prev.map((fp, idx) =>
              idx === i ? { ...fp, step: msg.step, pct: msg.progress } : fp
            ))
            setAnalysisProgress({ ...msg, document_id: doc.id })

            if (msg.step === 'done') {
              setFiles(prev => prev.map((fp, idx) =>
                idx === i ? { ...fp, status: 'done', pct: 100 } : fp
              ))
              resolve()
            }

            if (msg.step === 'error') {
              setFiles(prev => prev.map((fp, idx) =>
                idx === i ? { ...fp, status: 'error', pct: 0 } : fp
              ))
              resolve()
            }
          })
          stopPollsRef.current.push(stopPoll)
        })
      } catch {
        setFiles(prev => prev.map((fp, idx) =>
          idx === i ? { ...fp, status: 'error', step: 'error', pct: 0 } : fp
        ))
      }
    }

    // All files processed
    playSound('complete')
    await fetchDocuments()
    await fetchGraph()

    setTimeout(() => {
      setUploading(false)
      setFiles([])
      setAnalysisProgress(null)
      onClose()
    }, 1000)
  }, [fetchDocuments, fetchGraph, onClose, setAnalysisProgress, t])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length > 0) handleFiles(droppedFiles)
  }

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length > 0) handleFiles(selectedFiles)
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
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    Puedes seleccionar multiples archivos
                  </p>
                  <input ref={inputRef} type="file" accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.tiff,.tif"
                    multiple onChange={onSelect} className="hidden" />
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
                <div className="w-full h-40 rounded-xl overflow-hidden mb-4"
                  style={{ background: 'var(--color-surface-0)' }}>
                  <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
                    <ambientLight intensity={0.2} />
                    <AnalysisAnimation progress={currentFile?.pct ?? overallPct} />
                    <EffectComposer>
                      <Bloom intensity={1.2} luminanceThreshold={0.2} mipmapBlur />
                    </EffectComposer>
                  </Canvas>
                </div>

                {/* File list with individual progress */}
                <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                  {files.map((fp, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {fp.status === 'done' ? (
                        <CheckCircle2 size={14} className="shrink-0" style={{ color: 'var(--color-severity-low)' }} />
                      ) : fp.status === 'error' ? (
                        <AlertCircle size={14} className="shrink-0" style={{ color: 'var(--color-severity-critical)' }} />
                      ) : fp.status === 'analyzing' || fp.status === 'uploading' ? (
                        <Loader2 size={14} className="shrink-0 animate-spin" style={{ color: 'var(--color-accent)' }} />
                      ) : (
                        <div className="w-3.5 h-3.5 shrink-0 rounded-full" style={{ background: 'var(--color-fill-subtle)' }} />
                      )}
                      <span className="truncate flex-1" style={{
                        color: fp.status === 'done' ? 'var(--color-text-muted)' :
                               fp.status === 'analyzing' || fp.status === 'uploading' ? 'var(--color-text-primary)' :
                               'var(--color-text-muted)'
                      }}>
                        {fp.name}
                      </span>
                      {(fp.status === 'analyzing' || fp.status === 'uploading') && (
                        <span className="text-xs" style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>
                          {fp.pct}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Current step */}
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 size={16} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {currentFile
                      ? `${t(stepLabels[currentFile.step] ?? 'upload.analyzing')} — ${currentFile.name}`
                      : t('upload.done')
                    }
                  </span>
                </div>

                {/* Overall progress bar */}
                <div className="w-full h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'var(--color-fill-subtle)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'var(--color-accent)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${overallPct}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-right text-xs mt-1" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {files.filter(f => f.status === 'done').length}/{files.length} archivos — {overallPct}%
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
