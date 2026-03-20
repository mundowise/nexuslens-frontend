import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const _dir = new THREE.Vector3()

export default function CursorGlow() {
  const lightRef = useRef<THREE.PointLight>(null)

  useFrame(({ raycaster }) => {
    if (!lightRef.current) return
    _dir.copy(raycaster.ray.direction).multiplyScalar(6)
    lightRef.current.position.copy(raycaster.ray.origin).add(_dir)
  })

  return <pointLight ref={lightRef} intensity={1.2} distance={10} color="#8b7aff" decay={2} />
}
