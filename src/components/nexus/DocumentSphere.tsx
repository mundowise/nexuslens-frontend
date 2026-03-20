import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { getCategoryColor } from '@/lib/utils'
import type { GraphNode } from '@/types'

interface Props {
  node: GraphNode
  onClick: () => void
  onDoubleClick: () => void
}

export default function DocumentSphere({ node, onClick, onDoubleClick }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const color = getCategoryColor(node.category)
  const isDoc = node.node_type === 'document'
  const isFinding = node.node_type === 'finding'
  const baseSize = isDoc ? 0.7 + Math.min(node.finding_count * 0.08, 0.4) : 0.2
  const _sv = useRef(new THREE.Vector3())

  useFrame(({ clock }, delta) => {
    if (!meshRef.current) return

    const s = hovered ? 1.15 : 1
    _sv.current.set(s, s, s)
    meshRef.current.scale.lerp(_sv.current, delta * 6)

    if (isDoc && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.15
    }

    if (glowRef.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 1.5 + node.x) * 0.06
      glowRef.current.scale.set(pulse, pulse, pulse)
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = hovered ? 0.2 : 0.1
    }

    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.3
      ringRef.current.rotation.x = Math.PI / 3
    }

    if (isFinding && groupRef.current) {
      const t = clock.elapsedTime
      const seed = node.id.charCodeAt(0) + node.id.charCodeAt(4)
      const spd = 0.2 + (seed % 5) * 0.06
      const r = 0.4
      groupRef.current.position.x = node.x + Math.sin(t * spd + seed) * r
      groupRef.current.position.y = node.y + Math.cos(t * spd * 0.7 + seed) * r * 0.5
      groupRef.current.position.z = node.z + Math.sin(t * spd * 0.4 + seed * 0.3) * r
    }
  })

  const label = node.label.length > 28 ? node.label.slice(0, 26) + '…' : node.label

  const sphere = (
    <group ref={groupRef} position={[node.x, node.y, node.z]}>
      {isDoc && (
        <>
          <mesh ref={glowRef}>
            <sphereGeometry args={[baseSize * 2.5, 24, 24]} />
            <meshBasicMaterial color={color} transparent opacity={0.1} depthWrite={false} side={THREE.BackSide} />
          </mesh>

          <mesh ref={ringRef}>
            <torusGeometry args={[baseSize * 1.6, 0.02, 16, 64]} />
            <meshBasicMaterial color={color} transparent opacity={hovered ? 0.5 : 0.2} depthWrite={false} />
          </mesh>
        </>
      )}

      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick() }}
        onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick() }}
        onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default' }}>
        <sphereGeometry args={[baseSize, 48, 48]} />
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 2.0 : 0.8}
          roughness={0.25}
          metalness={0.7}
          clearcoat={1}
          clearcoatRoughness={0.1}
          transparent
          opacity={0.95}
        />
      </mesh>

      {isDoc && (
        <Billboard follow>
          <Text
            position={[0, baseSize + 0.5, 0]}
            fontSize={0.32}
            color="#e8e8f0"
            anchorX="center"
            anchorY="bottom"
            maxWidth={4}
            outlineWidth={0.02}
            outlineColor="#000000"
            letterSpacing={0.02}>
            {label}
          </Text>
          {node.risk_score != null && node.risk_score > 0 && (
            <Text
              position={[0, baseSize + 0.2, 0]}
              fontSize={0.2}
              color={node.risk_score >= 7 ? '#ef4444' : node.risk_score >= 4 ? '#f59e0b' : '#10b981'}
              anchorX="center"
              anchorY="bottom"
              outlineWidth={0.01}
              outlineColor="#000000">
              {`Risk ${node.risk_score.toFixed(1)}`}
            </Text>
          )}
        </Billboard>
      )}
    </group>
  )

  if (isDoc) {
    return <Float speed={1.0} rotationIntensity={0.05} floatIntensity={0.3}>{sphere}</Float>
  }
  return sphere
}
