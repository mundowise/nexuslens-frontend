import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import { X, FileText, Link2 } from 'lucide-react'
import { getSeverityClass } from '@/lib/utils'
import type { DocumentDetail, Connection } from '@/types'

interface DocPanelProps {
  doc: DocumentDetail | null
  onClose: () => void
  onAnalyze: () => void
}

export function DocumentPanel({ doc, onClose, onAnalyze }: DocPanelProps) {
  const { t } = useTranslation()

  return (
    <AnimatePresence>
      {doc && (
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.25 }}
          role="complementary"
          className="absolute right-4 top-4 bottom-4 w-80 glass p-4 overflow-y-auto z-10 flex flex-col gap-3">

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <FileText size={16} style={{ color: 'var(--color-accent)' }} />
              <h3 className="text-sm font-semibold truncate">{doc.name}</h3>
            </div>
            <button onClick={onClose} className="p-1 rounded btn-ghost shrink-0">
              <X size={14} style={{ color: 'var(--color-text-muted)' }} />
            </button>
          </div>

          <div className="text-xs space-y-1" style={{ color: 'var(--color-text-muted)' }}>
            <p>{doc.category} &middot; {doc.page_count} {t('lens.page').toLowerCase()}s</p>
            {doc.overall_risk_score != null && (
              <p>{t('lens.risk_score')}: <strong>{doc.overall_risk_score.toFixed(1)}</strong>/10</p>
            )}
          </div>

          {doc.analysis_json?.summary ? (
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {String(doc.analysis_json.summary)}
            </p>
          ) : null}

          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {doc.findings?.length ?? 0} {t('common.findings')}
          </p>

          <button onClick={onAnalyze}
            className="mt-auto w-full py-2 rounded-lg text-sm text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-accent)' }}>
            {t('lens.title')}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface ConnPanelProps {
  connection: Connection | null
  onClose: () => void
}

export function ConnectionPanel({ connection, onClose }: ConnPanelProps) {
  const { t } = useTranslation()

  return (
    <AnimatePresence>
      {connection && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.2 }}
          role="complementary"
          className="absolute bottom-20 left-1/2 -translate-x-1/2 w-96 max-w-[90vw] glass p-4 z-10">

          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Link2 size={14} style={{ color: 'var(--color-accent)' }} />
              <span className="text-sm font-medium">{t('nexus.connection_found')}</span>
            </div>
            <button onClick={onClose} className="p-1 rounded btn-ghost">
              <X size={12} style={{ color: 'var(--color-text-muted)' }} />
            </button>
          </div>

          <div className={getSeverityClass(connection.severity ?? 'info') + ' glass p-3 mb-2'}>
            <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
              <span>{connection.source_document_name}</span>
              <span>&harr;</span>
              <span>{connection.target_document_name}</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {connection.source_finding_title} &mdash; {connection.target_finding_title}
            </p>
          </div>

          {connection.human_explanation && (
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {connection.human_explanation}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <span className="px-2 py-0.5 rounded-full" style={{ background: 'var(--color-fill-subtle)' }}>
              {connection.relationship_type}
            </span>
            {connection.strength != null && (
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                {Math.round(connection.strength * 100)}%
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
