import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Props {
  position: [number, number, number]
  radius: number
  color: string
}

export default function ClusterHalo({ position, radius, color }: Props) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material as THREE.MeshBasicMaterial
    mat.opacity = 0.03 + Math.sin(clock.elapsedTime * 0.5) * 0.015
  })

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius * 0.3, radius, 48]} />
      <meshBasicMaterial color={color} transparent opacity={0.04} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  )
}
