import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { CalendarClock } from 'lucide-react'
import { useDocuments } from '@/stores/documents'
import AlertCard from './AlertCard'
import TimelineChart from './TimelineChart'
import DependencyLines from './DependencyLines'

export default function TimelineView() {
  const { t } = useTranslation()
  const { alerts, timelineEvents, fetchAlerts, fetchTimeline, error } = useDocuments()

  useEffect(() => {
    fetchTimeline()
    fetchAlerts()
  }, [fetchTimeline, fetchAlerts])

  const months = useMemo(() => {
    const grouped: Record<string, typeof timelineEvents> = {}
    for (const ev of timelineEvents) {
      if (!ev.event_date) continue
      const key = ev.event_date.slice(0, 7)
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(ev)
    }
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
  }, [timelineEvents])

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="glass p-6 text-center">
          <p className="text-sm mb-2" style={{ color: 'var(--color-severity-critical)' }}>{error}</p>
          <button onClick={() => { fetchTimeline(); fetchAlerts() }} className="text-sm underline"
            style={{ color: 'var(--color-accent)' }}>{t('common.retry')}</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto w-full">
      <h1 className="text-xl font-semibold mb-6" style={{ fontFamily: 'var(--font-display)' }}>
        {t('timeline.title')}
      </h1>

      {timelineEvents.length > 0 && (
        <section className="mb-6 glass p-4">
          <TimelineChart events={timelineEvents} />
        </section>
      )}

      {alerts.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-medium mb-3 flex items-center gap-2"
            style={{ color: 'var(--color-text-muted)' }}>
            <CalendarClock size={14} />
            {t('timeline.alerts')} ({alerts.length})
          </h2>
          <div className="grid gap-2 relative pl-8">
            <DependencyLines alerts={alerts} />
            {alerts.map((alert, i) => (
              <div key={alert.event.id} data-alert-idx={i}>
                <AlertCard alert={alert} index={i} />
              </div>
            ))}
          </div>
        </section>
      )}

      {months.length > 0 ? (
        <section>
          <h2 className="text-sm font-medium mb-4" style={{ color: 'var(--color-text-muted)' }}>
            {t('timeline.upcoming')}
          </h2>

          <div className="relative pl-6">
            <div className="absolute left-2 top-0 bottom-0 w-px line-vertical" />

            {months.map(([month, events]) => (
              <div key={month} className="mb-6">
                <div className="flex items-center gap-3 mb-3 -ml-6">
                  <div className="w-4 h-4 rounded-full border-2 shrink-0"
                    style={{ borderColor: 'var(--color-accent)', background: 'var(--color-surface-0)' }} />
                  <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-display)' }}>
                    {month}
                  </span>
                </div>

                <div className="grid gap-2">
                  {events.map((ev, i) => {
                    const dotColor = ev.severity === 'critical' ? 'var(--color-severity-critical)'
                      : ev.severity === 'warning' ? 'var(--color-severity-warning)'
                      : 'var(--color-severity-info)'

                    return (
                      <motion.div
                        key={ev.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="glass p-3 flex items-center gap-3">

                        <div className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: dotColor }} />

                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{ev.description}</p>
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            {ev.document_name} &middot; {ev.event_date}
                          </p>
                        </div>

                        {ev.is_recurring && (
                          <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
                            style={{ background: 'rgba(109,92,255,0.1)', color: 'var(--color-accent)' }}>
                            {ev.recurrence_pattern}
                          </span>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="flex items-center justify-center py-12 text-sm"
          style={{ color: 'var(--color-text-muted)' }}>
          {t('timeline.no_events')}
        </div>
      )}
    </div>
  )
}
