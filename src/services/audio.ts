import { Howl } from 'howler'

const sounds: Record<string, Howl> = {}
let enabled = localStorage.getItem('nexuslens-audio') !== 'off'

function load(name: string, src: string): Howl {
  if (!sounds[name]) {
    sounds[name] = new Howl({ src: [src], volume: 0.3, preload: true })
  }
  return sounds[name]
}

load('whoosh', '/audio/whoosh.mp3')
load('node-select', '/audio/node-select.mp3')
load('risk-alert', '/audio/risk-alert.mp3')
load('complete', '/audio/complete.mp3')

export function playSound(name: 'whoosh' | 'node-select' | 'risk-alert' | 'complete') {
  if (!enabled) return
  sounds[name]?.play()
}

export function setAudioEnabled(on: boolean) {
  enabled = on
}
