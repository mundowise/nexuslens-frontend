import { create } from 'zustand'
import type { User } from '@/types'
import { authApi } from '@/services/api'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  init: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('nexuslens-token'),
  loading: true,

  init: async () => {
    const token = localStorage.getItem('nexuslens-token')
    if (!token) {
      set({ loading: false })
      return
    }
    try {
      const { data } = await authApi.me()
      set({ user: data, token, loading: false })
    } catch {
      localStorage.removeItem('nexuslens-token')
      set({ user: null, token: null, loading: false })
    }
  },

  login: async (email, password) => {
    const { data } = await authApi.login(email, password)
    localStorage.setItem('nexuslens-token', data.access_token)
    const me = await authApi.me()
    set({ token: data.access_token, user: me.data })
  },

  register: async (email, password) => {
    const { data } = await authApi.register(email, password)
    localStorage.setItem('nexuslens-token', data.access_token)
    const me = await authApi.me()
    set({ token: data.access_token, user: me.data })
  },

  logout: () => {
    localStorage.removeItem('nexuslens-token')
    set({ user: null, token: null })
  },
}))
