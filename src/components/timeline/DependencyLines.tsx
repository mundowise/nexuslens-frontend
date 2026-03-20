import { useEffect, useRef, useMemo } from 'react'
import * as d3 from 'd3'
import { useApp } from '@/stores/app'
import type { Alert } from '@/types'

interface Props {
  alerts: Alert[]
}

export default function DependencyLines({ alerts }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const { theme } = useApp()

  const links = useMemo(() => {
    const result: { sourceIdx: number; targetIdx: number; severity: string }[] = []
    for (let i = 0; i < alerts.length; i++) {
      for (const rel of alerts[i].related_events) {
        const j = alerts.findIndex((a) => a.event.id === rel.id)
        if (j > i) {
          result.push({ sourceIdx: i, targetIdx: j, severity: alerts[i].event.severity ?? 'info' })
        }
      }
    }
    return result
  }, [alerts])

  useEffect(() => {
    if (!svgRef.current || links.length === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const parent = svgRef.current.parentElement
    if (!parent) return

    const cards = parent.querySelectorAll('[data-alert-idx]')
    if (cards.length === 0) return

    const parentRect = parent.getBoundingClientRect()

    const severityColor: Record<string, string> = {
      critical: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6',
    }

    const isDark = theme === 'dark'

    for (const link of links) {
      const src = cards[link.sourceIdx] as HTMLElement
      const tgt = cards[link.targetIdx] as HTMLElement
      if (!src || !tgt) continue

      const srcRect = src.getBoundingClientRect()
      const tgtRect = tgt.getBoundingClientRect()

      const x1 = 0
      const y1 = srcRect.top - parentRect.top + srcRect.height / 2
      const x2 = 0
      const y2 = tgtRect.top - parentRect.top + tgtRect.height / 2
      const color = severityColor[link.severity] ?? '#6d5cff'

      const curveX = -25

      svg.append('path')
        .attr('d', `M ${x1},${y1} C ${curveX},${y1} ${curveX},${y2} ${x2},${y2}`)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 1.5)
        .attr('stroke-opacity', isDark ? 0.4 : 0.3)
        .attr('stroke-dasharray', '4,3')

      // dot at connection points
      svg.append('circle').attr('cx', x1).attr('cy', y1).attr('r', 3)
        .attr('fill', color).attr('fill-opacity', 0.6)
      svg.append('circle').attr('cx', x2).attr('cy', y2).attr('r', 3)
        .attr('fill', color).attr('fill-opacity', 0.6)
    }
  }, [links, theme, alerts])

  if (links.length === 0) return null

  return (
    <svg ref={svgRef} className="absolute left-0 top-0 w-8 h-full pointer-events-none overflow-visible" />
  )
}
