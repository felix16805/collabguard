// Type declarations for react-force-graph-2d and react-force-graph-3d
// These packages don't ship with complete TS types — minimal declarations to satisfy TypeScript

declare module "react-force-graph-2d" {
  import { ComponentType } from "react"

  interface GraphNode {
    id: string | number
    [key: string]: unknown
  }

  interface GraphLink {
    source: string | number | GraphNode
    target: string | number | GraphNode
    [key: string]: unknown
  }

  interface GraphData {
    nodes: GraphNode[]
    links: GraphLink[]
  }

  interface ForceGraph2DProps {
    graphData?: GraphData
    width?: number
    height?: number
    backgroundColor?: string
    nodeColor?: string | ((node: unknown) => string)
    nodeLabel?: string | ((node: unknown) => string)
    nodeVal?: number | ((node: unknown) => number)
    nodeOpacity?: number
    linkColor?: string | ((link: unknown) => string)
    linkWidth?: number | ((link: unknown) => number)
    linkOpacity?: number
    linkDirectionalParticles?: number | ((link: unknown) => number)
    linkDirectionalParticleSpeed?: number
    linkDirectionalParticleColor?: string | ((link: unknown) => string)
    onNodeClick?: (node: unknown, event: MouseEvent) => void
    onLinkClick?: (link: unknown, event: MouseEvent) => void
    cooldownTime?: number
    d3AlphaDecay?: number
    d3VelocityDecay?: number
  }

  export default function ForceGraph2D(props: ForceGraph2DProps): JSX.Element
}

declare module "react-force-graph-3d" {
  import { ComponentType } from "react"

  interface GraphNode {
    id: string | number
    [key: string]: unknown
  }

  interface GraphLink {
    source: string | number | GraphNode
    target: string | number | GraphNode
    [key: string]: unknown
  }

  interface GraphData {
    nodes: GraphNode[]
    links: GraphLink[]
  }

  interface ForceGraph3DProps {
    graphData?: GraphData
    width?: number
    height?: number
    backgroundColor?: string
    nodeColor?: string | ((node: unknown) => string)
    nodeLabel?: string | ((node: unknown) => string)
    nodeVal?: number | ((node: unknown) => number)
    nodeOpacity?: number
    linkColor?: string | ((link: unknown) => string)
    linkWidth?: number | ((link: unknown) => number)
    linkOpacity?: number
    linkDirectionalParticles?: number | ((link: unknown) => number)
    linkDirectionalParticleSpeed?: number
    linkDirectionalParticleColor?: string | ((link: unknown) => string)
    onNodeClick?: (node: unknown, event: MouseEvent) => void
    enableNodeDrag?: boolean
    enableNavigationControls?: boolean
    cooldownTime?: number
    d3AlphaDecay?: number
    d3VelocityDecay?: number
  }

  export default function ForceGraph3D(props: ForceGraph3DProps): JSX.Element
}
