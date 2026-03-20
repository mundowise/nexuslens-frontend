import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { useApp } from '@/stores/app'
import DocumentSphere from './DocumentSphere'
import Synapse from './Synapse'
import CursorGlow from './CursorGlow'
import ClusterHalo from './ClusterHalo'
import Starfield from './Starfield'
import ParticleBurst from './ParticleBurst'
import { getCategoryColor } from '@/lib/utils'
import type { GraphData, GraphNode } from '@/types'

interface Props {
  graph: GraphData
  onNodeClick: (node: GraphNode) => void
  onNodeDoubleClick: (node: GraphNode) => void
  onEdgeClick?: (edgeId: string) => void
  burst?: { color: string } | null
  onBurstComplete?: () => void
}

export default function NexusScene({ graph, onNodeClick, onNodeDoubleClick, onEdgeClick, burst, onBurstComplete }: Props) {
  const { theme } = useApp()
  const isDark = theme === 'dark'

  const nodeMap = useMemo(() => {
    const m = new Map<string, GraphNode>()
    for (const n of graph.nodes) m.set(n.id, n)
    return m
  }, [graph.nodes])

  const clusters = useMemo(() => {
    const groups: Record<string, { x: number; y: number; z: number; count: number }> = {}
    const docNodes = graph.nodes.filter((n) => n.node_type === 'document')

    for (const n of docNodes) {
      const cat = n.category || 'other'
      if (!groups[cat]) groups[cat] = { x: 0, y: 0, z: 0, count: 0 }
      groups[cat].x += n.x
      groups[cat].y += n.y
      groups[cat].z += n.z
      groups[cat].count++
    }

    const result: { position: [number, number, number]; radius: number; color: string }[] = []
    for (const [cat, g] of Object.entries(groups)) {
      if (g.count < 2) continue
      const cx = g.x / g.count
      const cy = g.y / g.count
      const cz = g.z / g.count

      let maxR = 0
      for (const n of docNodes) {
        if ((n.category || 'other') !== cat) continue
        const d = Math.sqrt((n.x - cx) ** 2 + (n.z - cz) ** 2)
        if (d > maxR) maxR = d
      }

      result.push({
        position: [cx, cy - 0.5, cz],
        radius: maxR + 2,
        color: getCategoryColor(cat),
      })
    }
    return result
  }, [graph.nodes])

  return (
    <div className="nexus-space w-full h-full" style={{ minHeight: 'calc(100dvh - 4rem)', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, 22], fov: 65, near: 0.1, far: 500 }}
        gl={{ antialias: true, alpha: true }}
        style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'transparent' }}>

        <Suspense fallback={null}>
          <ambientLight intensity={isDark ? 0.15 : 0.6} />
          <directionalLight position={[8, 12, 10]} intensity={isDark ? 0.5 : 1.0} color={isDark ? '#eeeeff' : '#ffffff'} />
          <pointLight position={[-10, -3, 5]} intensity={isDark ? 0.3 : 0.4} color={isDark ? '#4466ff' : '#6d5cff'} distance={40} />
          <pointLight position={[10, 5, -5]} intensity={isDark ? 0.2 : 0.3} color={isDark ? '#6644ff' : '#8070ff'} distance={35} />
          <pointLight position={[0, -8, 0]} intensity={isDark ? 0.1 : 0.2} color={isDark ? '#2244aa' : '#6d5cff'} distance={30} />

          {isDark && <Starfield />}

          {clusters.map((c, i) => (
            <ClusterHalo key={i} position={c.position} radius={c.radius} color={c.color} />
          ))}

          {graph.nodes.map((node) => (
            <DocumentSphere
              key={node.id}
              node={node}
              onClick={() => onNodeClick(node)}
              onDoubleClick={() => onNodeDoubleClick(node)}
            />
          ))}

          {graph.edges.map((edge) => (
            <Synapse key={edge.id} edge={edge} nodeMap={nodeMap}
              onClick={() => onEdgeClick?.(edge.id)} />
          ))}

          {burst && <ParticleBurst color={burst.color} onComplete={onBurstComplete} />}

          <CursorGlow />

          <OrbitControls
            enableDamping
            enablePan
            dampingFactor={0.06}
            minDistance={3}
            maxDistance={50}
            target={[0, 0, 0]}
            rotateSpeed={0.6}
            zoomSpeed={1.0}
            panSpeed={0.8}
            makeDefault
          />

          {isDark && (
            <EffectComposer multisampling={0}>
              <Bloom intensity={1.5} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur />
            </EffectComposer>
          )}
        </Suspense>
      </Canvas>
    </div>
  )
}
