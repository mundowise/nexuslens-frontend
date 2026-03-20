import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { SkeletonCard, SkeletonList } from './Skeleton'

describe('Skeleton', () => {
  it('SkeletonCard renders animated divs', () => {
    const { container } = render(<SkeletonCard />)
    const pulses = container.querySelectorAll('.animate-pulse')
    expect(pulses.length).toBeGreaterThan(0)
  })

  it('SkeletonList renders N cards', () => {
    const { container } = render(<SkeletonList count={3} />)
    const cards = container.querySelectorAll('.glass')
    expect(cards.length).toBe(3)
  })

  it('SkeletonList defaults to 4', () => {
    const { container } = render(<SkeletonList />)
    const cards = container.querySelectorAll('.glass')
    expect(cards.length).toBe(4)
  })
})
