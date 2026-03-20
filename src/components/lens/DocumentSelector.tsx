import { useTranslation } from 'react-i18next'
import { FileText, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Document } from '@/types'

interface Props {
  documents: Document[]
  currentId: string | null
  onSelect: (id: string) => void
}

export default function DocumentSelector({ documents, currentId, onSelect }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const current = documents.find((d) => d.id === currentId)

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="glass px-3 py-2 flex items-center gap-2 text-sm w-full"
        style={{ borderRadius: '0.5rem' }}>
        <FileText size={14} style={{ color: 'var(--color-text-muted)' }} />
        <span className="truncate flex-1 text-left">
          {current?.name || t('lens.title')}
        </span>
        <ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')}
          style={{ color: 'var(--color-text-muted)' }} />
      </button>

      {open && (
        <div role="listbox" className="absolute top-full left-0 right-0 mt-1 z-20 glass p-1 max-h-48 overflow-y-auto"
          style={{ borderRadius: '0.5rem' }}>
          {documents.map((doc) => (
            <button key={doc.id}
              role="option"
              aria-selected={doc.id === currentId}
              onClick={() => { onSelect(doc.id); setOpen(false) }}
              className={cn(
                'w-full px-3 py-2 text-sm text-left rounded-md flex items-center gap-2 transition-colors',
                doc.id === currentId ? 'font-medium' : ''
              )}
              style={{
                background: doc.id === currentId ? 'var(--color-fill-hover)' : 'transparent',
                color: doc.id === currentId ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              }}>
              <FileText size={12} style={{ color: 'var(--color-text-muted)' }} />
              <span className="truncate">{doc.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
