import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AuthPage from './AuthPage'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}))

vi.mock('@/stores/auth', () => ({
  useAuth: vi.fn(() => ({
    login: vi.fn(),
    register: vi.fn(),
  })),
}))

import { useAuth } from '@/stores/auth'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AuthPage', () => {
  it('renders login form by default', () => {
    render(<AuthPage />)
    expect(screen.getByText('auth.login')).toBeInTheDocument()
    expect(screen.getByText('auth.email')).toBeInTheDocument()
    expect(screen.getByText('auth.password')).toBeInTheDocument()
  })

  it('switches between login and register', async () => {
    render(<AuthPage />)
    const user = userEvent.setup()

    const toggleBtn = screen.getByRole('button', { name: 'auth.register' })
    await user.click(toggleBtn)

    const submitBtn = screen.getByRole('button', { name: 'auth.register' })
    expect(submitBtn).toBeInTheDocument()
  })

  it('submits login form', async () => {
    const loginFn = vi.fn()
    vi.mocked(useAuth).mockReturnValue({ login: loginFn, register: vi.fn() } as any)

    render(<AuthPage />)
    const user = userEvent.setup()

    const form = screen.getByRole('form')
    const allInputs = form.querySelectorAll('input')

    await user.type(allInputs[0], 'test@test.com')
    await user.type(allInputs[1], 'password123')
    await user.click(screen.getByRole('button', { name: 'auth.login' }))

    await waitFor(() => {
      expect(loginFn).toHaveBeenCalledWith('test@test.com', 'password123')
    })
  })

  it('shows error on 401', async () => {
    const loginFn = vi.fn().mockRejectedValue({ response: { status: 401 } })
    vi.mocked(useAuth).mockReturnValue({ login: loginFn, register: vi.fn() } as any)

    render(<AuthPage />)
    const user = userEvent.setup()

    const allInputs = screen.getByRole('form').querySelectorAll('input')
    await user.type(allInputs[0], 'bad@test.com')
    await user.type(allInputs[1], 'wrongpass1')
    await user.click(screen.getByRole('button', { name: 'auth.login' }))

    await waitFor(() => {
      expect(screen.getByText('auth.error_invalid')).toBeInTheDocument()
    })
  })

  it('shows error on 409 in register mode', async () => {
    const registerFn = vi.fn().mockRejectedValue({ response: { status: 409 } })
    vi.mocked(useAuth).mockReturnValue({ login: vi.fn(), register: registerFn } as any)

    render(<AuthPage />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'auth.register' }))

    const allInputs = screen.getByRole('form').querySelectorAll('input')
    await user.type(allInputs[0], 'exists@test.com')
    await user.type(allInputs[1], 'password123')
    await user.type(allInputs[2], 'password123')
    await user.click(screen.getAllByRole('button', { name: 'auth.register' })[0])

    await waitFor(() => {
      expect(screen.getByText('auth.error_exists')).toBeInTheDocument()
    })
  })
})
