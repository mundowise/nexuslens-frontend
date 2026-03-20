import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function Starfield() {
  const ref = useRef<THREE.Points>(null)

  const geo = useMemo(() => {
    const n = 2500
    const pos = new Float32Array(n * 3)
    const col = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 60 + Math.random() * 40
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
      const t = Math.random()
      col[i * 3] = t > 0.7 ? 1 : 0.85
      col[i * 3 + 1] = t > 0.7 ? 0.9 : 0.88
      col[i * 3 + 2] = t > 0.5 ? 1 : 0.8
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    return g
  }, [])

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.001
  })

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.2} vertexColors transparent opacity={0.8} sizeAttenuation={false} depthWrite={false} />
    </points>
  )
}
