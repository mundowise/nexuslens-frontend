import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Props {
  color: string
  position: [number, number, number]
  onComplete: () => void
}

const PARTICLE_COUNT = 50
const DURATION = 1.0

export default function ParticleBurst({ color, position, onComplete }: Props) {
  const pointsRef = useRef<THREE.Points>(null)
  const startTime = useRef(performance.now() / 1000)

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3)
    const vel = new Float32Array(PARTICLE_COUNT * 3)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      pos[i3] = position[0]
      pos[i3 + 1] = position[1]
      pos[i3 + 2] = position[2]

      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const speed = 1.5 + Math.random() * 3
      vel[i3] = Math.sin(phi) * Math.cos(theta) * speed
      vel[i3 + 1] = Math.sin(phi) * Math.sin(theta) * speed
      vel[i3 + 2] = Math.cos(phi) * speed
    }
    return { positions: pos, velocities: vel }
  }, [position])

  useFrame(() => {
    if (!pointsRef.current) return
    const elapsed = performance.now() / 1000 - startTime.current
    if (elapsed >= DURATION) {
      onComplete()
      return
    }

    const t = elapsed / DURATION
    const geo = pointsRef.current.geometry
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute
    const arr = posAttr.array as Float32Array

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      arr[i3] = position[0] + velocities[i3] * t
      arr[i3 + 1] = position[1] + velocities[i3 + 1] * t
      arr[i3 + 2] = position[2] + velocities[i3 + 2] * t
    }
    posAttr.needsUpdate = true

    const mat = pointsRef.current.material as THREE.PointsMaterial
    mat.opacity = 1 - t * t
    mat.size = 0.1 * (1 - t * 0.5)
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.1}
        transparent
        opacity={1}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
