import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { GraphEdge, GraphNode } from '@/types'

interface Props {
  edge: GraphEdge
  nodeMap: Map<string, GraphNode>
  onClick?: () => void
}

const severityColors: Record<string, string> = {
  critical: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
}

const _up = new THREE.Vector3(0, 1, 0)

export default function Synapse({ edge, nodeMap, onClick }: Props) {
  const source = nodeMap.get(edge.source)
  const target = nodeMap.get(edge.target)
  const tubeRef = useRef<THREE.Mesh>(null)

  const { curve, midpoint, length, quaternion } = useMemo(() => {
    if (!source || !target) return { curve: null, midpoint: null, length: 0, quaternion: null }
    const a = new THREE.Vector3(source.x, source.y, source.z)
    const b = new THREE.Vector3(target.x, target.y, target.z)
    const mid = new THREE.Vector3().lerpVectors(a, b, 0.5)
    mid.y += a.distanceTo(b) * 0.15

    const c = new THREE.QuadraticBezierCurve3(a, mid, b)
    const dir = new THREE.Vector3().subVectors(b, a).normalize()
    const quat = new THREE.Quaternion().setFromUnitVectors(_up, dir)
    return { curve: c, midpoint: mid, length: a.distanceTo(b), quaternion: quat }
  }, [source, target])

  useFrame(({ clock }) => {
    if (!tubeRef.current) return
    const mat = tubeRef.current.material as THREE.MeshBasicMaterial
    const base = 0.4 + (edge.strength ?? 0.5) * 0.4
    const pulse = Math.sin(clock.elapsedTime * 2 + (edge.source.charCodeAt(0) || 0)) * 0.15
    mat.opacity = base + pulse
  })

  if (!curve || !midpoint || !quaternion) return null

  const color = severityColors[edge.severity ?? 'info'] ?? '#6d5cff'
  const thickness = 0.03 + (edge.strength ?? 0.5) * 0.04

  return (
    <group renderOrder={1}>
      <mesh ref={tubeRef}>
        <tubeGeometry args={[curve, 32, thickness, 8, false]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {onClick && (
        <mesh position={midpoint} quaternion={quaternion}
          onClick={(e) => { e.stopPropagation(); onClick() }}
          onPointerOver={() => { document.body.style.cursor = 'pointer' }}
          onPointerOut={() => { document.body.style.cursor = 'default' }}>
          <cylinderGeometry args={[0.12, 0.12, length * 0.85, 6]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}
    </group>
  )
}
