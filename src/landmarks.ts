// Shared by the tile worker (which recognises landmarks and picks their tint)
// and the facade renderer (which draws them).
export type LandmarkStyle = 'cathedral' | 'mosque' | 'temple' | 'shrine' | 'fortress' | 'ruins' |
  'arena' | 'ironwork' | 'belltower' | 'skyscraper' | 'bridge' | 'palace'

// Bitmon stone and metal palette; a mapped `colour` snaps to the nearest entry.
// stone, marble, grey, sandstone, travertine, brick, bronze, iron, ochre, rose
export const LANDMARK_TINTS = [
  '#e4d6b8', '#f4f1ea', '#d9d9d4', '#d8bf94', '#e6d3a6',
  '#c9805f', '#7d6a52', '#5c5a55', '#efe0a8', '#e3b8a8',
]
export const DEFAULT_TINT: Record<LandmarkStyle, number> = {
  cathedral: 0, mosque: 1, temple: 5, shrine: 1, fortress: 2, ruins: 2,
  arena: 4, ironwork: 6, belltower: 0, skyscraper: 2, bridge: 0, palace: 3,
}
