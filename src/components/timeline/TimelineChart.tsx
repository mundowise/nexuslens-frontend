import { useMemo } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { useApp } from '@/stores/app'
import { getCategoryColor } from '@/lib/utils'
import type { TimelineEvent } from '@/types'

interface Props {
  events: TimelineEvent[]
  onEventClick?: (eventId: string) => void
}

const severitySize: Record<string, number> = {
  critical: 220,
  warning: 150,
  info: 90,
  ok: 60,
}

const severityColors: Record<string, string> = {
  critical: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  ok: '#10b981',
}

const categories = ['housing', 'financial', 'employment', 'medical', 'insurance', 'subscription', 'legal', 'other']

export default function TimelineChart({ events, onEventClick }: Props) {
  const { theme } = useApp()
  const isDark = theme === 'dark'

  const data = useMemo(() => {
    return events
      .filter((e) => e.event_date)
      .map((e) => {
        const catIdx = categories.indexOf(e.document_category ?? 'other')
        const cat = catIdx >= 0 ? catIdx : categories.length - 1

        return {
          id: e.id,
          x: new Date(e.event_date!).getTime(),
          y: cat,
          z: severitySize[e.severity ?? 'info'] ?? 90,
          severity: e.severity ?? 'info',
          label: e.description ?? '',
          docName: e.document_name ?? '',
          date: e.event_date,
        }
      })
  }, [events])

  if (data.length === 0) return null

  const xMin = Math.min(...data.map((d) => d.x))
  const xMax = Math.max(...data.map((d) => d.x))
  const pad = (xMax - xMin) * 0.08 || 86400000

  const axisColor = isDark ? '#5c5c72' : '#71717a'
  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'

  return (
    <div className="w-full h-52 mb-6">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
          <XAxis
            dataKey="x" type="number" name="date"
            domain={[xMin - pad, xMax + pad]}
            tickFormatter={(v: number) => {
              const d = new Date(v)
              return `${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`
            }}
            tick={{ fontSize: 11, fill: axisColor }}
            axisLine={{ stroke: gridColor }}
            tickLine={false}
          />
          <YAxis
            dataKey="y" type="number" name="category"
            domain={[-0.5, categories.length - 0.5]}
            tickFormatter={(v: number) => categories[v] ?? ''}
            tick={{ fontSize: 10, fill: axisColor }}
            axisLine={{ stroke: gridColor }}
            tickLine={false}
            width={80}
          />
          <ZAxis dataKey="z" range={[40, 250]} />
          <Tooltip
            cursor={false}
            content={({ payload }) => {
              if (!payload?.length) return null
              const d = payload[0].payload
              return (
                <div className="glass px-3 py-2 text-xs" style={{ borderRadius: '0.5rem' }}>
                  <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{d.label}</p>
                  <p style={{ color: 'var(--color-text-muted)' }}>{d.docName} &middot; {d.date}</p>
                </div>
              )
            }}
          />
          <Scatter data={data} onClick={(d: any) => onEventClick?.(d.id)}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={severityColors[entry.severity] ?? '#6d5cff'}
                fillOpacity={0.7}
                stroke={severityColors[entry.severity] ?? '#6d5cff'}
                strokeWidth={1}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
