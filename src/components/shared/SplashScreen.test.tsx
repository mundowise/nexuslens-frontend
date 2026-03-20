import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import SplashScreen from './SplashScreen'

describe('SplashScreen', () => {
  it('renders logo text', () => {
    render(<SplashScreen onDone={vi.fn()} />)
    expect(screen.getByText('NexusLens')).toBeInTheDocument()
  })

  it('has status role for accessibility', () => {
    const { container } = render(<SplashScreen onDone={vi.fn()} />)
    expect(container.querySelector('[role="status"]')).toBeInTheDocument()
  })

  it('has aria-live polite', () => {
    const { container } = render(<SplashScreen onDone={vi.fn()} />)
    expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument()
  })
})
