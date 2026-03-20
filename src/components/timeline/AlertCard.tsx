import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { Bell, Link2 } from 'lucide-react'
import { cn, getSeverityClass } from '@/lib/utils'
import { playSound } from '@/services/audio'
import type { Alert } from '@/types'

interface Props {
  alert: Alert
  index: number
}

export default function AlertCard({ alert, index }: Props) {
  const { t } = useTranslation()
  const urgent = alert.days_until <= 7

  useEffect(() => {
    if (urgent && index === 0) {
      playSound('risk-alert')
    }
  }, [urgent, index])

  return (
    <motion.div
      role={urgent ? 'alert' : undefined}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      className={cn('glass p-4', getSeverityClass(alert.event.severity ?? 'info'))}>

      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5 p-1.5 rounded-lg', urgent && 'animate-pulse')}
          style={{ background: urgent ? 'rgba(239,68,68,0.15)' : 'var(--color-fill-subtle)' }}>
          <Bell size={14} className={urgent ? 'text-red-400' : ''} style={urgent ? {} : { color: 'var(--color-text-muted)' }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-sm font-medium truncate">{alert.event.description}</p>
            <span className={cn('text-xs px-2 py-0.5 rounded-full shrink-0',
              urgent ? 'bg-red-500/15 text-red-400' : ''
            )} style={urgent ? { fontFamily: 'var(--font-mono)' } : { background: 'var(--color-fill-subtle)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              {alert.days_until}d
            </span>
          </div>

          <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
            {alert.event.document_name} &middot; {alert.event.event_date}
          </p>

          <p className="text-xs leading-relaxed mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            {alert.alert_message}
          </p>

          {alert.event.is_recurring && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mr-2"
              style={{ background: 'rgba(109,92,255,0.12)', color: 'var(--color-accent)' }}>
              {t('timeline.recurring')}: {alert.event.recurrence_pattern}
            </span>
          )}

          {alert.related_events.length > 0 && (
            <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <Link2 size={10} />
              {t('timeline.related')}: {alert.related_events.map((r) => r.document_name).filter(Boolean).join(', ')}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
