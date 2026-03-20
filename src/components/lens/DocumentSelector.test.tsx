import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DocumentSelector from './DocumentSelector'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

const docs = [
  { id: 'd1', name: 'contrato.pdf', category: 'housing', uploaded_at: '', page_count: 1, overall_risk_score: 5, analysis_json: null },
  { id: 'd2', name: 'poliza.pdf', category: 'insurance', uploaded_at: '', page_count: 2, overall_risk_score: 3, analysis_json: null },
]

describe('DocumentSelector', () => {
  it('shows current document name', () => {
    render(<DocumentSelector documents={docs} currentId="d1" onSelect={vi.fn()} />)
    expect(screen.getByText('contrato.pdf')).toBeInTheDocument()
  })

  it('opens dropdown on click', async () => {
    render(<DocumentSelector documents={docs} currentId="d1" onSelect={vi.fn()} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button'))
    expect(screen.getByText('poliza.pdf')).toBeInTheDocument()
  })

  it('calls onSelect when picking a doc', async () => {
    const onSelect = vi.fn()
    render(<DocumentSelector documents={docs} currentId="d1" onSelect={onSelect} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('poliza.pdf'))
    expect(onSelect).toHaveBeenCalledWith('d2')
  })
})
