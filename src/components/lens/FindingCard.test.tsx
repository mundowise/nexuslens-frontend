import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FindingCard from './FindingCard'
import type { Finding } from '@/types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const baseFinding: Finding = {
  id: 'f1',
  document_id: 'd1',
  type: 'risk',
  severity: 'critical',
  title: 'Renovacion automatica',
  description: 'Incremento del 8% anual',
  original_text: 'El contrato se renueva con incremento del 8%',
  human_explanation: 'Te van a cobrar mas si no cancelas',
  page_number: 2,
  position_json: null,
  confidence: 0.92,
  suggested_questions: ['Se puede negociar?'],
}

describe('FindingCard', () => {
  it('renders title and confidence', () => {
    render(<FindingCard finding={baseFinding} index={0} />)
    expect(screen.getByText('Renovacion automatica')).toBeInTheDocument()
    expect(screen.getByText('92%')).toBeInTheDocument()
  })

  it('shows description', () => {
    render(<FindingCard finding={baseFinding} index={0} />)
    expect(screen.getByText('Incremento del 8% anual')).toBeInTheDocument()
  })

  it('shows page number', () => {
    render(<FindingCard finding={baseFinding} index={0} />)
    expect(screen.getByText(/lens.page/)).toBeInTheDocument()
  })

  it('expands on click to show explanation', async () => {
    render(<FindingCard finding={baseFinding} index={0} />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /lens.explanation/i }))
    expect(screen.getByText(/Te van a cobrar/)).toBeInTheDocument()
  })

  it('shows original text when expanded', async () => {
    render(<FindingCard finding={baseFinding} index={0} />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /lens.explanation/i }))
    expect(screen.getByText(/El contrato se renueva/)).toBeInTheDocument()
  })

  it('shows suggested questions', async () => {
    render(<FindingCard finding={baseFinding} index={0} />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /lens.explanation/i }))
    expect(screen.getByText('Se puede negociar?')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<FindingCard finding={baseFinding} index={0} onClick={onClick} />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('article'))
    expect(onClick).toHaveBeenCalled()
  })

  it('has animate-pulse on critical severity', () => {
    render(<FindingCard finding={baseFinding} index={0} />)
    const card = screen.getByRole('article')
    expect(card.className).toContain('animate-pulse')
  })

  it('no pulse on info severity', () => {
    render(<FindingCard finding={{ ...baseFinding, severity: 'info' }} index={0} />)
    const card = screen.getByRole('article')
    expect(card.className).not.toContain('animate-pulse')
  })
})
