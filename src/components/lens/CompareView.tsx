import { useState, useEffect, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import { X, ArrowLeftRight, Loader2 } from 'lucide-react'
import { useDocuments } from '@/stores/documents'
import { docsApi } from '@/services/api'
import { cn, getSeverityClass } from '@/lib/utils'

const PdfViewer = lazy(() => import('./PdfViewer'))

interface Props {
  open: boolean
  onClose: () => void
}

export default function CompareView({ open, onClose }: Props) {
  const { t } = useTranslation()
  const { documents, compareResult, compareDocuments, loading } = useDocuments()
  const [docA, setDocA] = useState('')
  const [docB, setDocB] = useState('')
  const [showPdfs, setShowPdfs] = useState(false)
  const [blobA, setBlobA] = useState<string | null>(null)
  const [blobB, setBlobB] = useState<string | null>(null)

  useEffect(() => {
    if (!showPdfs || !docA) return
    let ref: string | null = null
    docsApi.getFileBlob(docA).then((url) => { ref = url; setBlobA(url) }).catch(() => setBlobA(null))
    return () => { if (ref) URL.revokeObjectURL(ref) }
  }, [showPdfs, docA])

  useEffect(() => {
    if (!showPdfs || !docB) return
    let ref: string | null = null
    docsApi.getFileBlob(docB).then((url) => { ref = url; setBlobB(url) }).catch(() => setBlobB(null))
    return () => { if (ref) URL.revokeObjectURL(ref) }
  }, [showPdfs, docB])

  const run = async () => {
    if (!docA || !docB || docA === docB) return
    await compareDocuments(docA, docB)
  }

  const nameA = documents.find((d) => d.id === docA)?.name ?? 'A'
  const nameB = documents.find((d) => d.id === docB)?.name ?? 'B'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}>

          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={cn(
              'glass mx-4 p-6 overflow-y-auto',
              showPdfs ? 'w-full max-w-6xl max-h-[90vh]' : 'w-full max-w-2xl max-h-[80vh]'
            )}
            onClick={(e) => e.stopPropagation()}>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ArrowLeftRight size={18} style={{ color: 'var(--color-accent)' }} />
                <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                  {t('lens.compare')}
                </h2>
              </div>
              <button onClick={onClose} className="p-1 rounded btn-ghost">
                <X size={18} style={{ color: 'var(--color-text-muted)' }} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <select value={docA} onChange={(e) => setDocA(e.target.value)}
                className="input-field px-3 py-2 rounded-lg text-sm">
                <option value="">{t('lens.doc_a')}</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <select value={docB} onChange={(e) => setDocB(e.target.value)}
                className="input-field px-3 py-2 rounded-lg text-sm">
                <option value="">{t('lens.doc_b')}</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 mb-4">
              <button onClick={run} disabled={!docA || !docB || docA === docB || loading}
                className="flex-1 py-2 rounded-lg text-sm text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ background: 'var(--color-accent)' }}>
                {loading && <Loader2 size={14} className="animate-spin" />}
                {t('lens.compare')}
              </button>
              {docA && docB && (
                <button onClick={() => setShowPdfs(!showPdfs)}
                  className="px-4 py-2 rounded-lg text-sm btn-ghost"
                  style={{ color: 'var(--color-text-secondary)' }}>
                  {showPdfs ? t('lens.hide_pdfs') : t('lens.show_pdfs')}
                </button>
              )}
            </div>

            {showPdfs && docA && docB && (
              <div className="grid grid-cols-2 gap-3 mb-4 h-80 border rounded-xl overflow-hidden"
                style={{ borderColor: 'var(--color-border)' }}>
                <Suspense fallback={<div className="flex items-center justify-center" style={{ color: 'var(--color-text-muted)' }}>...</div>}>
                  <div className="flex flex-col">
                    <div className="px-3 py-1 text-xs font-medium border-b truncate"
                      style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}>
                      {nameA}
                    </div>
                    <PdfViewer fileUrl={blobA} />
                  </div>
                </Suspense>
                <Suspense fallback={<div className="flex items-center justify-center" style={{ color: 'var(--color-text-muted)' }}>...</div>}>
                  <div className="flex flex-col border-l" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="px-3 py-1 text-xs font-medium border-b truncate"
                      style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}>
                      {nameB}
                    </div>
                    <PdfViewer fileUrl={blobB} />
                  </div>
                </Suspense>
              </div>
            )}

            {compareResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="space-y-3">

                <div className="glass p-3">
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {compareResult.summary}
                  </p>
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full mt-2"
                    style={{
                      background: compareResult.risk_change === 'increased' ? 'rgba(239,68,68,0.12)'
                        : compareResult.risk_change === 'decreased' ? 'rgba(16,185,129,0.12)'
                        : 'var(--color-fill-subtle)',
                      color: compareResult.risk_change === 'increased' ? 'var(--color-severity-critical)'
                        : compareResult.risk_change === 'decreased' ? 'var(--color-severity-ok)'
                        : 'var(--color-text-muted)',
                    }}>
                    {compareResult.risk_change}
                  </span>
                </div>

                {compareResult.changes.map((change, i) => (
                  <div key={i} className={cn('glass p-3', getSeverityClass(change.severity))}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: change.type === 'added' ? 'rgba(16,185,129,0.12)'
                            : change.type === 'removed' ? 'rgba(239,68,68,0.12)'
                            : 'rgba(59,130,246,0.12)',
                          color: change.type === 'added' ? 'var(--color-severity-ok)'
                            : change.type === 'removed' ? 'var(--color-severity-critical)'
                            : 'var(--color-severity-info)',
                        }}>
                        {change.type}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      {change.description}
                    </p>

                    {(change.original_text || change.new_text) && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {change.original_text && (
                          <div className="text-xs p-2 rounded"
                            style={{ background: 'rgba(239,68,68,0.06)', color: 'var(--color-text-secondary)' }}>
                            <del>{change.original_text}</del>
                          </div>
                        )}
                        {change.new_text && (
                          <div className="text-xs p-2 rounded"
                            style={{ background: 'rgba(16,185,129,0.06)', color: 'var(--color-text-secondary)' }}>
                            <ins style={{ textDecoration: 'none' }}>{change.new_text}</ins>
                          </div>
                        )}
                      </div>
                    )}

                    {change.impact && (
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        {change.impact}
                      </p>
                    )}
                  </div>
                ))}

                {compareResult.recommendation && (
                  <div className="glass p-3">
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
                      {t('lens.recommendation')}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {compareResult.recommendation}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
