import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
})

class MockHowl {
  play = vi.fn()
  stop = vi.fn()
  constructor(_opts: unknown) {}
}

vi.mock('howler', () => ({ Howl: MockHowl }))

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

const localStore: Record<string, string> = {}
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: (key: string) => localStore[key] ?? null,
    setItem: (key: string, val: string) => { localStore[key] = val },
    removeItem: (key: string) => { delete localStore[key] },
    clear: () => { Object.keys(localStore).forEach(k => delete localStore[k]) },
  },
})
