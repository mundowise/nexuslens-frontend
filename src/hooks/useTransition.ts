import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export function usePageTransition(containerRef: React.RefObject<HTMLDivElement | null>, mode: string) {
  const prevMode = useRef(mode)

  useEffect(() => {
    if (prevMode.current === mode || !containerRef.current) {
      prevMode.current = mode
      return
    }

    const el = containerRef.current
    const tl = gsap.timeline()

    if (prevMode.current === 'nexus' && mode === 'lens') {
      // nexus -> lens: zoom in + fade
      tl.fromTo(el,
        { scale: 0.85, opacity: 0, filter: 'blur(8px)' },
        { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.4, ease: 'power2.out' }
      )
    } else if (prevMode.current === 'lens' && mode === 'nexus') {
      // lens -> nexus: zoom out + fade
      tl.fromTo(el,
        { scale: 1.1, opacity: 0, filter: 'blur(6px)' },
        { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.35, ease: 'power2.out' }
      )
    } else if (mode === 'timeline') {
      // slide up into timeline
      tl.fromTo(el,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35, ease: 'power3.out' }
      )
    } else {
      // generic crossfade
      tl.fromTo(el,
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: 'power1.out' }
      )
    }

    prevMode.current = mode

    return () => { tl.kill() }
  }, [mode, containerRef])
}
