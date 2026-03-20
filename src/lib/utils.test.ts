import { describe, it, expect } from 'vitest'
import { cn, getCategoryColor, getSeverityClass, truncate } from './utils'

describe('cn', () => {
  it('merges classes', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('handles conditionals', () => {
    expect(cn('base', false && 'nope', 'yes')).toBe('base yes')
  })

  it('dedupes tailwind conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })
})

describe('getCategoryColor', () => {
  it('returns blue for housing', () => {
    expect(getCategoryColor('housing')).toBe('#3b82f6')
  })

  it('returns green for financial', () => {
    expect(getCategoryColor('financial')).toBe('#10b981')
  })

  it('falls back to gray for null', () => {
    expect(getCategoryColor(null)).toBe('#6b7280')
  })

  it('falls back to gray for unknown category', () => {
    expect(getCategoryColor('xyz')).toBe('#6b7280')
  })
})

describe('getSeverityClass', () => {
  it('maps critical', () => {
    expect(getSeverityClass('critical')).toBe('severity-critical')
  })

  it('maps warning', () => {
    expect(getSeverityClass('warning')).toBe('severity-warning')
  })

  it('returns empty for unknown', () => {
    expect(getSeverityClass('banana')).toBe('')
  })
})

describe('truncate', () => {
  it('leaves short strings alone', () => {
    expect(truncate('hi', 10)).toBe('hi')
  })

  it('truncates long strings with ellipsis', () => {
    const result = truncate('this is a long string', 10)
    expect(result).toBe('this is a …')
    expect(result.length).toBe(11)
  })

  it('exact length stays unchanged', () => {
    expect(truncate('12345', 5)).toBe('12345')
  })
})
