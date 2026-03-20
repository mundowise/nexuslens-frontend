import { create } from 'zustand'
import type { AppMode, Theme, Lang } from '@/types'

interface AppState {
  mode: AppMode
  theme: Theme
  lang: Lang
  audioEnabled: boolean
  setMode: (mode: AppMode) => void
  toggleTheme: () => void
  setLang: (lang: Lang) => void
  toggleAudio: () => void
}

function getInitialTheme(): Theme {
  const saved = localStorage.getItem('nexuslens-theme')
  if (saved === 'light' || saved === 'dark') return saved
  return 'dark'
}

export const useApp = create<AppState>((set) => ({
  mode: 'nexus',
  theme: getInitialTheme(),
  lang: (localStorage.getItem('nexuslens-lang') as Lang) || 'es',
  audioEnabled: localStorage.getItem('nexuslens-audio') !== 'off',

  setMode: (mode) => set({ mode }),

  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('nexuslens-theme', next)
      if (next === 'light') {
        document.body.classList.add('light')
      } else {
        document.body.classList.remove('light')
      }
      return { theme: next }
    }),

  setLang: (lang) => {
    localStorage.setItem('nexuslens-lang', lang)
    set({ lang })
  },

  toggleAudio: () =>
    set((s) => {
      const next = !s.audioEnabled
      localStorage.setItem('nexuslens-audio', next ? 'on' : 'off')
      return { audioEnabled: next }
    }),
}))
