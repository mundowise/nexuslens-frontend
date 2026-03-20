import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { AlertTriangle, Clock, DollarSign, HelpCircle, ShieldAlert, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { cn, getSeverityClass } from '@/lib/utils'
import type { Finding } from '@/types'

const typeIcons: Record<string, typeof AlertTriangle> = {
  risk: ShieldAlert,
  obligation: AlertTriangle,
  deadline: Clock,
  cost: DollarSign,
  question: HelpCircle,
}

interface Props {
  finding: Finding
  index: number
  onClick?: () => void
}

export default function FindingCard({ finding, index, onClick }: Props) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const [humanMode, setHumanMode] = useState(true)
  const Icon = typeIcons[finding.type] || AlertTriangle

  return (
    <motion.div
      role="article"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className={cn(
        'glass p-4 cursor-pointer',
        getSeverityClass(finding.severity),
        finding.severity === 'critical' && 'animate-pulse',
      )}
      onClick={onClick}>

      <div className="flex items-start gap-3">
        <div className="mt-0.5 p-1.5 rounded-lg" style={{ background: 'var(--color-fill-subtle)' }}>
          <Icon size={16} style={{ color: 'var(--color-text-secondary)' }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium truncate">{finding.title}</h3>
            {finding.confidence != null && (
              <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
                style={{ background: 'var(--color-fill-subtle)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                {Math.round(finding.confidence * 100)}%
              </span>
            )}
          </div>

          {finding.description && (
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {finding.description}
            </p>
          )}

          {finding.page_number && (
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {t('lens.page')} {finding.page_number}
            </span>
          )}

          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
              aria-expanded={expanded}
              className="flex items-center gap-1 text-xs transition-colors"
              style={{ color: 'var(--color-accent)' }}>
              <ChevronDown size={12} className={cn('transition-transform', expanded && 'rotate-180')} />
              {expanded ? t('lens.original_text') : t('lens.explanation')}
            </button>

            {expanded && finding.human_explanation && finding.description && (
              <button
                onClick={(e) => { e.stopPropagation(); setHumanMode(!humanMode) }}
                className="text-xs px-2 py-0.5 rounded-full transition-colors"
                style={{
                  background: humanMode ? 'rgba(109,92,255,0.15)' : 'var(--color-fill-subtle)',
                  color: humanMode ? 'var(--color-accent)' : 'var(--color-text-muted)',
                }}>
                {humanMode ? t('lens.explanation') : t('lens.original_text')}
              </button>
            )}
          </div>

          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden">

              <p className="text-xs leading-relaxed mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                {humanMode
                  ? (finding.human_explanation || finding.description)
                  : (finding.description || finding.human_explanation)
                }
              </p>

              {finding.original_text && (
                <blockquote className="text-xs mt-2 pl-3 py-2 italic"
                  style={{ borderLeft: '2px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                  &ldquo;{finding.original_text}&rdquo;
                </blockquote>
              )}

              {finding.suggested_questions && finding.suggested_questions.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    {t('lens.questions')}:
                  </p>
                  <ul className="space-y-1">
                    {finding.suggested_questions.map((q, i) => (
                      <li key={i} className="text-xs flex gap-1.5"
                        style={{ color: 'var(--color-text-secondary)' }}>
                        <span style={{ color: 'var(--color-accent)' }}>?</span> {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
