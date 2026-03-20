import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Props {
  progress: number // 0..100
  particleCount?: number
}

export default function AnalysisAnimation({ progress, particleCount = 200 }: Props) {
  const pointsRef = useRef<THREE.Points>(null)
  const phase = progress / 100

  const { positions, colors, targets } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    const col = new Float32Array(particleCount * 3)
    const tgt = new Float32Array(particleCount * 3)

    const palette = [
      [0.23, 0.51, 0.98], // blue
      [0.06, 0.73, 0.51], // green
      [0.55, 0.36, 0.96], // purple
      [0.93, 0.27, 0.27], // red
      [0.96, 0.62, 0.04], // amber
    ]

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      // random scattered start positions
      pos[i3] = (Math.random() - 0.5) * 12
      pos[i3 + 1] = (Math.random() - 0.5) * 8
      pos[i3 + 2] = (Math.random() - 0.5) * 6

      // cluster targets — 5 groups
      const group = i % 5
      const angle = (group / 5) * Math.PI * 2
      const radius = 2.5
      tgt[i3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.8
      tgt[i3 + 1] = (Math.random() - 0.5) * 1.5
      tgt[i3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.8

      const c = palette[group]
      col[i3] = c[0]
      col[i3 + 1] = c[1]
      col[i3 + 2] = c[2]
    }
    return { positions: pos, colors: col, targets: tgt }
  }, [particleCount])

  useFrame((_, delta) => {
    if (!pointsRef.current) return
    const geo = pointsRef.current.geometry
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute
    const arr = posAttr.array as Float32Array

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3

      if (phase < 0.2) {
        // 0-20%: scatter / drift outward
        arr[i3] += (Math.random() - 0.5) * delta * 2
        arr[i3 + 1] += (Math.random() - 0.5) * delta * 2
        arr[i3 + 2] += (Math.random() - 0.5) * delta
      } else if (phase < 0.5) {
        // 20-50%: move toward cluster targets
        const speed = 0.8 + (phase - 0.2) * 3
        arr[i3] += (targets[i3] - arr[i3]) * delta * speed
        arr[i3 + 1] += (targets[i3 + 1] - arr[i3 + 1]) * delta * speed
        arr[i3 + 2] += (targets[i3 + 2] - arr[i3 + 2]) * delta * speed
      } else if (phase < 0.8) {
        const t = performance.now() * 0.001
        const orbitSpeed = 0.3 + (i % 7) * 0.05
        arr[i3] = targets[i3] + Math.sin(t * orbitSpeed + i) * 0.3
        arr[i3 + 1] = targets[i3 + 1] + Math.cos(t * orbitSpeed * 0.7 + i) * 0.2
        arr[i3 + 2] = targets[i3 + 2] + Math.sin(t * orbitSpeed * 0.5 + i * 0.5) * 0.3
      } else {
        // 80-100%: stabilize at final positions
        arr[i3] += (targets[i3] - arr[i3]) * delta * 4
        arr[i3 + 1] += (targets[i3 + 1] - arr[i3 + 1]) * delta * 4
        arr[i3 + 2] += (targets[i3 + 2] - arr[i3 + 2]) * delta * 4
      }
    }

    posAttr.needsUpdate = true

    // scale and opacity based on progress
    const mat = pointsRef.current.material as THREE.PointsMaterial
    if (phase >= 0.98) {
      mat.size = 0.2
      mat.opacity = 1
    } else {
      mat.size = phase > 0.8 ? 0.08 + (1 - phase) * 0.5 : 0.06 + phase * 0.12
      mat.opacity = Math.min(1, 0.3 + phase * 0.7)
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.5}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
