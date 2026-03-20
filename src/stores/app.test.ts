import { describe, it, expect, beforeEach } from 'vitest'
import { useApp } from './app'

beforeEach(() => {
  localStorage.clear()
  useApp.setState({
    mode: 'nexus',
    theme: 'dark',
    lang: 'es',
    audioEnabled: true,
  })
})

describe('app store', () => {
  it('starts with nexus mode', () => {
    expect(useApp.getState().mode).toBe('nexus')
  })

  it('switches mode', () => {
    useApp.getState().setMode('lens')
    expect(useApp.getState().mode).toBe('lens')
  })

  it('toggles theme dark -> light -> dark', () => {
    useApp.getState().toggleTheme()
    expect(useApp.getState().theme).toBe('light')
    expect(localStorage.getItem('nexuslens-theme')).toBe('light')

    useApp.getState().toggleTheme()
    expect(useApp.getState().theme).toBe('dark')
  })

  it('sets language and persists', () => {
    useApp.getState().setLang('en')
    expect(useApp.getState().lang).toBe('en')
    expect(localStorage.getItem('nexuslens-lang')).toBe('en')
  })

  it('toggles audio', () => {
    useApp.getState().toggleAudio()
    expect(useApp.getState().audioEnabled).toBe(false)
    expect(localStorage.getItem('nexuslens-audio')).toBe('off')

    useApp.getState().toggleAudio()
    expect(useApp.getState().audioEnabled).toBe(true)
    expect(localStorage.getItem('nexuslens-audio')).toBe('on')
  })
})
