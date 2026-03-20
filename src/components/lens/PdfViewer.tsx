import { useState, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import type { Finding } from '@/types'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const severityBg: Record<string, string> = {
  critical: 'rgba(239, 68, 68, 0.18)',
  warning: 'rgba(245, 158, 11, 0.15)',
  info: 'rgba(59, 130, 246, 0.12)',
  ok: 'rgba(16, 185, 129, 0.10)',
}

interface Props {
  fileUrl: string | null
  highlightPage?: number | null
  findings?: Finding[]
}

export default function PdfViewer({ fileUrl, highlightPage, findings = [] }: Props) {
  const { t } = useTranslation()
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1.0)
  const pageRef = useRef<HTMLDivElement>(null)

  const onLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n)
  }, [])

  useEffect(() => {
    if (highlightPage && highlightPage <= numPages && highlightPage !== currentPage) {
      setCurrentPage(highlightPage)
    }
  }, [highlightPage, numPages])

  const applyHighlights = useCallback(() => {
    if (!pageRef.current) return
    const textLayer = pageRef.current.querySelector('.react-pdf__Page__textContent')
    if (!textLayer) return

    pageRef.current.querySelectorAll('.finding-highlight').forEach((el) => el.remove())

    const pageFindings = findings.filter((f) => f.page_number === currentPage && f.original_text)
    if (!pageFindings.length) return

    const spans = textLayer.querySelectorAll('span')
    const fullText = Array.from(spans).map((s) => s.textContent).join('')

    for (const finding of pageFindings) {
      const needle = (finding.original_text ?? '').slice(0, 60)
      if (!needle) continue

      const idx = fullText.indexOf(needle)
      if (idx < 0) continue

      let charCount = 0
      for (const span of Array.from(spans)) {
        const len = (span.textContent ?? '').length
        if (charCount + len > idx) {
          const rect = span.getBoundingClientRect()
          const parentRect = textLayer.getBoundingClientRect()
          const overlay = document.createElement('div')
          overlay.className = 'finding-highlight'
          overlay.style.cssText = `
            position: absolute;
            left: ${rect.left - parentRect.left - 2}px;
            top: ${rect.top - parentRect.top - 1}px;
            width: ${Math.min(rect.width + 4, parentRect.width)}px;
            height: ${rect.height + 2}px;
            background: ${severityBg[finding.severity] ?? severityBg.info};
            border-radius: 2px;
            pointer-events: none;
            z-index: 1;
          `
          textLayer.appendChild(overlay)
          break
        }
        charCount += len
      }
    }
  }, [findings, currentPage])

  const onPageRender = useCallback(() => {
    setTimeout(applyHighlights, 100)
  }, [applyHighlights])

  if (!fileUrl) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--color-text-muted)' }}>
        <p className="text-sm">{t('lens.pdf_unavailable')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-1">
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1} aria-label={t('common.back')}
            className="p-1 rounded btn-ghost disabled:opacity-30">
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs px-2" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
            {currentPage} / {numPages}
          </span>
          <button onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            disabled={currentPage >= numPages} aria-label={t('lens.page') + ' ' + Math.min(numPages, currentPage + 1)}
            className="p-1 rounded btn-ghost disabled:opacity-30">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setScale((s) => Math.max(0.5, s - 0.15))}
            className="p-1 rounded btn-ghost">
            <ZoomOut size={14} />
          </button>
          <span className="text-xs w-10 text-center" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
            {Math.round(scale * 100)}%
          </span>
          <button onClick={() => setScale((s) => Math.min(2.5, s + 0.15))}
            className="p-1 rounded btn-ghost">
            <ZoomIn size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 flex justify-center"
        style={{ background: 'var(--color-surface-1)' }}>
        <div ref={pageRef}>
          <Document file={fileUrl} onLoadSuccess={onLoadSuccess}
            loading={<div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('lens.pdf_loading')}</div>}
            error={<div className="text-sm" style={{ color: 'var(--color-severity-critical)' }}>{t('lens.pdf_error')}</div>}>
            <Page pageNumber={currentPage} scale={scale}
              renderTextLayer renderAnnotationLayer
              onRenderSuccess={onPageRender} />
          </Document>
        </div>
      </div>
    </div>
  )
}
