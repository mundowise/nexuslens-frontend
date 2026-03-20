import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AlertCard from './AlertCard'
import type { Alert } from '@/types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

vi.mock('@/services/audio', () => ({
  playSound: vi.fn(),
}))

const baseAlert: Alert = {
  event: {
    id: 'e1',
    document_id: 'd1',
    finding_id: null,
    event_date: '2026-04-01',
    event_type: 'deadline',
    description: 'Vencimiento contrato',
    severity: 'critical',
    is_recurring: false,
    recurrence_pattern: null,
    document_name: 'contrato.pdf',
    document_category: 'housing',
  },
  alert_message: 'Tu contrato vence pronto',
  days_until: 5,
  related_events: [],
}

describe('AlertCard', () => {
  it('renders description and days', () => {
    render(<AlertCard alert={baseAlert} index={0} />)
    expect(screen.getByText('Vencimiento contrato')).toBeInTheDocument()
    expect(screen.getByText('5d')).toBeInTheDocument()
  })

  it('shows alert message from backend', () => {
    render(<AlertCard alert={baseAlert} index={0} />)
    expect(screen.getByText('Tu contrato vence pronto')).toBeInTheDocument()
  })

  it('shows document name and date', () => {
    render(<AlertCard alert={baseAlert} index={0} />)
    expect(screen.getByText(/contrato\.pdf/)).toBeInTheDocument()
    expect(screen.getByText(/2026-04-01/)).toBeInTheDocument()
  })

  it('shows recurring badge when applicable', () => {
    const recurring = {
      ...baseAlert,
      event: { ...baseAlert.event, is_recurring: true, recurrence_pattern: 'yearly' },
    }
    render(<AlertCard alert={recurring} index={0} />)
    expect(screen.getByText(/yearly/)).toBeInTheDocument()
  })

  it('shows related events', () => {
    const withRelated = {
      ...baseAlert,
      related_events: [{
        id: 'e2', document_id: 'd2', finding_id: null,
        event_date: '2026-04-05', event_type: 'deadline',
        description: 'Poliza vence', severity: 'warning',
        is_recurring: false, recurrence_pattern: null,
        document_name: 'poliza.pdf', document_category: 'insurance',
      }],
    }
    render(<AlertCard alert={withRelated} index={0} />)
    expect(screen.getByText(/poliza\.pdf/)).toBeInTheDocument()
  })

  it('has role=alert on urgent items', () => {
    const { container } = render(<AlertCard alert={baseAlert} index={0} />)
    expect(container.querySelector('[role="alert"]')).toBeInTheDocument()
  })

  it('no role=alert on non-urgent items', () => {
    const nonUrgent = { ...baseAlert, days_until: 30 }
    const { container } = render(<AlertCard alert={nonUrgent} index={0} />)
    expect(container.querySelector('[role="alert"]')).toBeNull()
  })
})
