import { useEffect, useMemo, useState, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { ArrowLeft, ShieldAlert, AlertTriangle, Clock, DollarSign, HelpCircle, Trash2, ArrowLeftRight, RotateCw } from 'lucide-react'
import { useDocuments } from '@/stores/documents'
import { docsApi } from '@/services/api'
import { useApp } from '@/stores/app'
import FindingCard from './FindingCard'
import DocumentSelector from './DocumentSelector'
import CompareView from './CompareView'
import { SkeletonList } from '@/components/shared/Skeleton'
import type { Finding } from '@/types'

const PdfViewer = lazy(() => import('./PdfViewer'))

const typeConfig: Record<string, { label: string; icon: typeof ShieldAlert }> = {
  risk: { label: 'lens.risks', icon: ShieldAlert },
  obligation: { label: 'lens.obligations', icon: AlertTriangle },
  deadline: { label: 'lens.deadlines', icon: Clock },
  cost: { label: 'lens.costs', icon: DollarSign },
  question: { label: 'lens.questions', icon: HelpCircle },
}

export default function LensView() {
  const { t } = useTranslation()
  const { current, documents, fetchDocument, clearCurrent, deleteDocument, loading, error } = useDocuments()
  const { setMode } = useApp()
  const [highlightPage, setHighlightPage] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!current && documents.length > 0) {
      fetchDocument(documents[0].id)
    }
  }, [current, documents, fetchDocument])

  useEffect(() => {
    if (!current) return
    let cancelled = false
    let blobRef: string | null = null
    docsApi.getFileBlob(current.id).then((url) => {
      if (cancelled) { URL.revokeObjectURL(url); return }
      blobRef = url
      setPdfUrl(url)
    }).catch(() => setPdfUrl(null))
    return () => {
      cancelled = true
      if (blobRef) URL.revokeObjectURL(blobRef)
    }
  }, [current?.id])

  const grouped = useMemo(() => {
    if (!current?.findings) return {}
    const groups: Record<string, Finding[]> = {}
    for (const f of current.findings) {
      if (!groups[f.type]) groups[f.type] = []
      groups[f.type].push(f)
    }
    return groups
  }, [current?.findings])

  const handleFindingClick = (finding: Finding) => {
    if (finding.page_number) setHighlightPage(finding.page_number)
  }

  const handleDelete = async () => {
    if (!current) return
    await deleteDocument(current.id)
    clearCurrent()
    setConfirmDelete(false)
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="glass p-6 text-center">
          <p className="text-sm mb-3" style={{ color: 'var(--color-severity-critical)' }}>{error}</p>
          <button onClick={() => setMode('nexus')} className="text-sm underline"
            style={{ color: 'var(--color-accent)' }}>{t('common.back')}</button>
        </div>
      </div>
    )
  }

  if (!current) {
    if (loading) {
      return (
        <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
          <SkeletonList count={5} />
        </div>
      )
    }
    return (
      <div className="flex-1 flex items-center justify-center"
        style={{ color: 'var(--color-text-muted)' }}>
        {t('nexus.no_documents')}
      </div>
    )
  }

  const riskScore = current.overall_risk_score ?? 0
  const riskColor = riskScore >= 7 ? 'var(--color-severity-critical)'
    : riskScore >= 4 ? 'var(--color-severity-warning)'
    : 'var(--color-severity-ok)'

  return (
    <div className="flex-1 flex flex-col lg:flex-row">
      <div className="lg:w-1/2 h-64 lg:h-auto border-b lg:border-b-0 lg:border-r"
        style={{ borderColor: 'var(--color-border)' }}>
        <Suspense fallback={
          <div className="h-full flex items-center justify-center"
            style={{ color: 'var(--color-text-muted)' }}>{t('common.loading')}</div>
        }>
          <PdfViewer fileUrl={pdfUrl} highlightPage={highlightPage}
            findings={current.findings} />
        </Suspense>
      </div>

      <div className="lg:w-1/2 flex flex-col overflow-y-auto p-4 sm:p-6 gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => { clearCurrent(); setMode('nexus') }}
            className="p-2 rounded-lg btn-ghost mt-0.5">
            <ArrowLeft size={18} style={{ color: 'var(--color-text-muted)' }} />
          </button>

          <div className="flex-1 min-w-0">
            <DocumentSelector
              documents={documents}
              currentId={current.id}
              onSelect={(id) => fetchDocument(id)}
            />
            <p className="text-xs mt-1 px-1" style={{ color: 'var(--color-text-muted)' }}>
              {current.page_count} {t('lens.page').toLowerCase()}s &middot; {current.category}
            </p>
          </div>

          <div className="glass px-3 py-1.5 flex items-center gap-2 shrink-0"
            style={{ borderRadius: '0.5rem' }}>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('lens.risk_score')}</span>
            <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: riskColor }}>
              {riskScore.toFixed(1)}
            </span>
          </div>

          <button onClick={async () => {
              await docsApi.reanalyze(current.id)
              setTimeout(() => fetchDocument(current.id), 3000)
            }} className="p-2 rounded-lg btn-ghost shrink-0"
            title={t('lens.reanalyze')}>
            <RotateCw size={16} style={{ color: 'var(--color-text-muted)' }} />
          </button>

          {documents.length >= 2 && (
            <button onClick={() => setCompareOpen(true)} className="p-2 rounded-lg btn-ghost shrink-0"
              title={t('lens.compare')}>
              <ArrowLeftRight size={16} style={{ color: 'var(--color-text-muted)' }} />
            </button>
          )}

          <div className="relative">
            {confirmDelete ? (
              <div className="glass p-2 flex items-center gap-2" style={{ borderRadius: '0.5rem' }}>
                <span className="text-xs" style={{ color: 'var(--color-severity-critical)' }}>
                  {t('common.confirm_delete')}
                </span>
                <button onClick={handleDelete} className="text-xs px-2 py-1 rounded"
                  style={{ background: 'var(--color-severity-critical)', color: '#fff' }}>
                  {t('common.delete')}
                </button>
                <button onClick={() => setConfirmDelete(false)} className="text-xs px-2 py-1 rounded btn-ghost">
                  {t('common.cancel')}
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="p-2 rounded-lg btn-ghost">
                <Trash2 size={16} style={{ color: 'var(--color-text-muted)' }} />
              </button>
            )}
          </div>
        </div>

        {current.analysis_json?.summary && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass p-4 text-sm leading-relaxed"
            style={{ color: 'var(--color-text-secondary)' }}>
            {String(current.analysis_json.summary)}
          </motion.div>
        )}

        {Object.keys(grouped).length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm"
            style={{ color: 'var(--color-text-muted)' }}>
            {t('lens.no_findings')}
          </div>
        ) : (
          <div className="grid gap-5">
            {Object.entries(typeConfig).map(([type, { label, icon: Icon }]) => {
              const items = grouped[type]
              if (!items?.length) return null
              return (
                <section key={type}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={14} style={{ color: 'var(--color-text-muted)' }} />
                    <h2 className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                      {t(label)} ({items.length})
                    </h2>
                  </div>
                  <div className="grid gap-2">
                    {items.map((f, i) => (
                      <FindingCard key={f.id} finding={f} index={i}
                        onClick={() => handleFindingClick(f)} />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>

      <CompareView open={compareOpen} onClose={() => setCompareOpen(false)} />
    </div>
  )
}
