import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuth } from './auth'

vi.mock('@/services/api', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    me: vi.fn(),
  },
}))

import { authApi } from '@/services/api'

const mockUser = { id: 'u1', email: 'test@test.com', created_at: '2026-01-01' }

beforeEach(() => {
  localStorage.clear()
  useAuth.setState({ user: null, token: null, loading: true })
  vi.clearAllMocks()
})

describe('auth store', () => {
  it('init with no token sets loading false', async () => {
    await useAuth.getState().init()
    expect(useAuth.getState().loading).toBe(false)
    expect(useAuth.getState().user).toBeNull()
  })

  it('init with valid token fetches user', async () => {
    localStorage.setItem('nexuslens-token', 'tok123')
    vi.mocked(authApi.me).mockResolvedValue({ data: mockUser } as any)

    await useAuth.getState().init()

    expect(useAuth.getState().user).toEqual(mockUser)
    expect(useAuth.getState().loading).toBe(false)
  })

  it('init with expired token clears state', async () => {
    localStorage.setItem('nexuslens-token', 'expired')
    vi.mocked(authApi.me).mockRejectedValue(new Error('401'))

    await useAuth.getState().init()

    expect(useAuth.getState().user).toBeNull()
    expect(localStorage.getItem('nexuslens-token')).toBeNull()
  })

  it('login stores token and fetches user', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ data: { access_token: 'new-tok' } } as any)
    vi.mocked(authApi.me).mockResolvedValue({ data: mockUser } as any)

    await useAuth.getState().login('a@b.com', 'pass1234')

    expect(localStorage.getItem('nexuslens-token')).toBe('new-tok')
    expect(useAuth.getState().user).toEqual(mockUser)
  })

  it('register stores token and fetches user', async () => {
    vi.mocked(authApi.register).mockResolvedValue({ data: { access_token: 'reg-tok' } } as any)
    vi.mocked(authApi.me).mockResolvedValue({ data: mockUser } as any)

    await useAuth.getState().register('new@b.com', 'pass1234')

    expect(localStorage.getItem('nexuslens-token')).toBe('reg-tok')
    expect(useAuth.getState().user).toEqual(mockUser)
  })

  it('logout clears everything', () => {
    localStorage.setItem('nexuslens-token', 'tok')
    useAuth.setState({ user: mockUser, token: 'tok' })

    useAuth.getState().logout()

    expect(useAuth.getState().user).toBeNull()
    expect(useAuth.getState().token).toBeNull()
    expect(localStorage.getItem('nexuslens-token')).toBeNull()
  })
})
