import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from './ErrorBoundary'

function BrokenChild() {
  throw new Error('test crash')
}

function GoodChild() {
  return <p>working</p>
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(<ErrorBoundary><GoodChild /></ErrorBoundary>)
    expect(screen.getByText('working')).toBeInTheDocument()
  })

  it('catches errors and shows fallback', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<ErrorBoundary><BrokenChild /></ErrorBoundary>)
    expect(screen.getByText('test crash')).toBeInTheDocument()
    spy.mockRestore()
  })

  it('shows reload button on error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<ErrorBoundary><BrokenChild /></ErrorBoundary>)
    expect(screen.getByRole('button')).toBeInTheDocument()
    spy.mockRestore()
  })
})
