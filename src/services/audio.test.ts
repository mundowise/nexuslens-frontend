import { describe, it, expect, vi, beforeEach } from 'vitest'
import { playSound, setAudioEnabled } from './audio'

describe('audio service', () => {
  beforeEach(() => {
    setAudioEnabled(true)
  })

  it('playSound does not throw when enabled', () => {
    expect(() => playSound('whoosh')).not.toThrow()
  })

  it('playSound does not throw when disabled', () => {
    setAudioEnabled(false)
    expect(() => playSound('node-select')).not.toThrow()
  })

  it('setAudioEnabled toggles state', () => {
    setAudioEnabled(false)
    expect(() => playSound('complete')).not.toThrow()

    setAudioEnabled(true)
    expect(() => playSound('risk-alert')).not.toThrow()
  })
})
