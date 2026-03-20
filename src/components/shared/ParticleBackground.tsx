import { useCallback } from 'react'
import Particles from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import type { Engine } from '@tsparticles/engine'
import { useApp } from '@/stores/app'

export default function ParticleBackground() {
  const { theme } = useApp()

  const init = useCallback(async (engine: Engine) => {
    await loadSlim(engine)
  }, [])

  const isDark = theme === 'dark'

  return (
    <Particles
      id="bg-particles"
      init={init}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      options={{
        fullScreen: false,
        fpsLimit: 60,
        particles: {
          number: { value: 160, density: { enable: true, width: 1400, height: 900 } },
          color: { value: isDark ? '#ffffff' : '#09090b' },
          opacity: {
            value: { min: 0.1, max: isDark ? 0.6 : 0.15 },
            animation: { enable: true, speed: 0.3, sync: false },
          },
          size: {
            value: { min: 0.3, max: 2.2 },
          },
          move: {
            enable: true,
            speed: 0.2,
            direction: 'none',
            outModes: { default: 'out' },
          },
          links: {
            enable: true,
            distance: 100,
            color: isDark ? '#6d5cff' : '#09090b',
            opacity: isDark ? 0.06 : 0.04,
            width: 0.5,
          },
          twinkle: {
            particles: { enable: true, frequency: 0.03, opacity: 0.8 },
          },
        },
        detectRetina: true,
      }}
    />
  )
}
