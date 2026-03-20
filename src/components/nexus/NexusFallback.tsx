import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { FileText, AlertTriangle } from 'lucide-react'
import { getCategoryColor, getSeverityClass } from '@/lib/utils'
import type { GraphData, GraphNode } from '@/types'

interface Props {
  graph: GraphData
  onNodeClick: (node: GraphNode) => void
  onNodeDoubleClick: (node: GraphNode) => void
}

export default function NexusFallback({ graph, onNodeClick, onNodeDoubleClick }: Props) {
  const { t } = useTranslation()

  const docNodes = graph.nodes.filter((n) => n.node_type === 'document')

  return (
    <div className="w-full h-full overflow-y-auto p-6" style={{ minHeight: 'calc(100dvh - 4rem)' }}>
      <div className="glass p-4 mb-4 flex items-center gap-2">
        <AlertTriangle size={16} style={{ color: 'var(--color-severity-warning)' }} />
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {t('nexus.webgl_unavailable')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {docNodes.map((node, i) => {
          const color = getCategoryColor(node.category)
          const riskScore = node.risk_score ?? 0
          const severity = riskScore >= 7 ? 'critical' : riskScore >= 4 ? 'warning' : 'ok'

          return (
            <motion.button
              key={node.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              className={`glass p-4 text-left transition-all hover:scale-[1.02] ${getSeverityClass(severity)}`}
              onClick={() => onNodeClick(node)}
              onDoubleClick={() => onNodeDoubleClick(node)}>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg shrink-0"
                  style={{ background: `${color}20` }}>
                  <FileText size={16} style={{ color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{node.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {node.category ?? 'other'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 text-xs"
                style={{ color: 'var(--color-text-muted)' }}>
                <span>{node.finding_count} {t('common.findings')}</span>
                {riskScore > 0 && (
                  <span className="px-2 py-0.5 rounded-full"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      background: `${color}15`,
                      color,
                    }}>
                    {riskScore.toFixed(1)}
                  </span>
                )}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
