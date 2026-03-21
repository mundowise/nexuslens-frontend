import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import { X, FileUp, Loader2, AlertCircle, CheckCircle2, FileStack, Files } from 'lucide-react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { docsApi, pollAnalysisProgress } from '@/services/api'
import { useDocuments } from '@/stores/documents'
import { useApp } from '@/stores/app'
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

type UploadMode = 'select' | 'single' | 'multi-separate' | 'multi-combined'

export default function UploadModal({ open, onClose }: Props) {
  const { t } = useTranslation()
  const { fetchDocuments, fetchGraph, setAnalysisProgress } = useDocuments()
  const { lang } = useApp()
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<{ step: string; pct: number } | null>(null)
  const [uploadError, setUploadError] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploadMode, setUploadMode] = useState<UploadMode>('select')
  const [docName, setDocName] = useState('')
  const [filesDone, setFilesDone] = useState(0)
  const [filesTotal, setFilesTotal] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const stopPollsRef = useRef<(() => void)[]>([])

  useEffect(() => {
    return () => {
      stopPollsRef.current.forEach(stop => stop())
    }
  }, [])

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setPendingFiles([])
      setUploadMode('select')
      setDocName('')
      setUploadError('')
      setFilesDone(0)
      setFilesTotal(0)
    }
  }, [open])

  const handleFilesSelected = (files: File[]) => {
    if (files.length === 0) return

    if (files.length === 1) {
      // Single file — upload directly
      uploadSeparate(files)
    } else {
      // Multiple files — ask user what to do
      setPendingFiles(files)
      setUploadMode('select')
    }
  }

  const waitForAnalysis = (docId: string): Promise<void> => {
    return new Promise((resolve) => {
      const stopPoll = pollAnalysisProgress(docId, (msg) => {
        setProgress({ step: msg.step, pct: msg.progress })
        setAnalysisProgress({ ...msg, document_id: docId })

        if (msg.step === 'done' || msg.step === 'error') {
          resolve()
        }
      })
      stopPollsRef.current.push(stopPoll)
    })
  }

  const uploadSeparate = async (files: File[]) => {
    setUploading(true)
    setUploadError('')
    setFilesTotal(files.length)
    setFilesDone(0)

    for (let i = 0; i < files.length; i++) {
      setProgress({ step: 'parsing', pct: 0 })
      try {
        const { data: doc } = await docsApi.upload(files[i], lang)
        await waitForAnalysis(doc.id)
        setFilesDone(i + 1)
      } catch {
        setUploadError(`Error subiendo ${files[i].name}`)
      }
    }

    playSound('complete')
    await fetchDocuments()
    await fetchGraph()
    setTimeout(() => {
      setUploading(false)
      setProgress(null)
      setAnalysisProgress(null)
      onClose()
    }, 500)
  }

  const uploadCombined = async (files: File[], name: string) => {
    setUploading(true)
    setUploadError('')
    setFilesTotal(1)
    setFilesDone(0)
    setProgress({ step: 'parsing', pct: 0 })

    try {
      const form = new FormData()
      files.forEach(f => form.append('files', f))
      if (name) form.append('document_name', name)

      const { data: doc } = await docsApi.uploadMulti(form, lang)
      await waitForAnalysis(doc.id)
      setFilesDone(1)

      playSound('complete')
      await fetchDocuments()
      await fetchGraph()
      setTimeout(() => {
        setUploading(false)
        setProgress(null)
        setAnalysisProgress(null)
        onClose()
      }, 500)
    } catch {
      setUploading(false)
      setProgress(null)
      setUploadError(t('common.error'))
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    handleFilesSelected(files)
  }

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFilesSelected(files)
  }

  const overallPct = filesTotal > 0
    ? Math.round(((filesDone * 100) + (progress?.pct || 0)) / filesTotal)
    : progress?.pct || 0

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={!uploading && pendingFiles.length === 0 ? onClose : undefined}>

          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="glass w-full max-w-lg mx-4 p-6 relative"
            onClick={(e) => e.stopPropagation()}>

            {!uploading && pendingFiles.length === 0 && (
              <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full btn-ghost">
                <X size={18} style={{ color: 'var(--color-text-muted)' }} />
              </button>
            )}

            <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              {t('upload.title')}
            </h2>

            {/* STEP 1: File picker */}
            {!uploading && pendingFiles.length === 0 && (
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
            )}

            {/* STEP 2: Multiple files — ask user */}
            {!uploading && pendingFiles.length > 1 && (
              <div className="space-y-4">
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Has seleccionado <strong>{pendingFiles.length} archivos</strong>. ¿Son paginas de un mismo documento o documentos separados?
                </p>

                <div className="space-y-2 max-h-32 overflow-y-auto text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {pendingFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <FileUp size={12} /> {f.name}
                    </div>
                  ))}
                </div>

                {/* Option 1: Single document */}
                <button
                  onClick={() => setUploadMode('multi-combined')}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left"
                  style={{
                    borderColor: uploadMode === 'multi-combined' ? 'var(--color-accent)' : 'var(--color-border)',
                    background: uploadMode === 'multi-combined' ? 'rgba(109,92,255,0.08)' : 'transparent',
                  }}>
                  <FileStack size={24} style={{ color: 'var(--color-accent)' }} />
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      Un solo documento
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Son paginas/fotos del mismo contrato o documento
                    </p>
                  </div>
                </button>

                {/* Option 2: Separate documents */}
                <button
                  onClick={() => setUploadMode('multi-separate')}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left"
                  style={{
                    borderColor: uploadMode === 'multi-separate' ? 'var(--color-accent)' : 'var(--color-border)',
                    background: uploadMode === 'multi-separate' ? 'rgba(109,92,255,0.08)' : 'transparent',
                  }}>
                  <Files size={24} style={{ color: 'var(--color-accent)' }} />
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      Documentos separados
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Cada archivo es un documento diferente
                    </p>
                  </div>
                </button>

                {/* Document name input for combined */}
                {uploadMode === 'multi-combined' && (
                  <div className="space-y-2">
                    <label className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      Nombre del documento (opcional)
                    </label>
                    <input
                      type="text"
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      placeholder="Ej: Contrato de arrendamiento"
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{
                        background: 'var(--color-surface-0)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => { setPendingFiles([]); setUploadMode('select') }}
                    className="px-4 py-2 rounded-lg text-sm btn-ghost">
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      if (uploadMode === 'multi-combined') {
                        uploadCombined(pendingFiles, docName)
                      } else if (uploadMode === 'multi-separate') {
                        uploadSeparate(pendingFiles)
                      }
                    }}
                    disabled={uploadMode === 'select'}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-30"
                    style={{
                      background: uploadMode !== 'select' ? 'var(--color-accent)' : 'var(--color-fill-subtle)',
                      color: uploadMode !== 'select' ? '#fff' : 'var(--color-text-muted)',
                    }}>
                    Subir {uploadMode === 'multi-combined' ? 'como un documento' : 'por separado'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Uploading / analyzing */}
            {uploading && (
              <div className="py-2">
                <div className="w-full h-40 rounded-xl overflow-hidden mb-4"
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
                    animate={{ width: `${overallPct}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-right text-xs mt-1" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {filesTotal > 1 ? `${filesDone}/${filesTotal} — ` : ''}{overallPct}%
                </p>

                {uploadError && (
                  <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(239,68,68,0.1)' }}>
                    <AlertCircle size={14} style={{ color: 'var(--color-severity-critical)' }} />
                    <span className="text-sm" style={{ color: 'var(--color-severity-critical)' }}>{uploadError}</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
