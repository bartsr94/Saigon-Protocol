import type { DistrictId } from './locations'

export interface MapPoint {
  x: number
  y: number
}

export interface DistrictRegionDefinition {
  id: DistrictId
  name: string
  shortName: string
  blurb: string
  accent: string
  labelAnchor: MapPoint
  polygon: MapPoint[]
}

export const DISTRICT_IDS: DistrictId[] = ['district1', 'district4', 'district5', 'district2']

export const DISTRICT_REGIONS: Record<DistrictId, DistrictRegionDefinition> = {
  district1: {
    id: 'district1',
    name: 'District 1',
    shortName: 'Core',
    blurb: 'Administrative towers, CID channels, and the polished surface of corporate order.',
    accent: '#7df9ff',
    labelAnchor: { x: 0.49, y: 0.56 },
    polygon: [
      { x: 0.446, y: 0.562 },
      { x: 0.489, y: 0.518 },
      { x: 0.541, y: 0.547 },
      { x: 0.519, y: 0.627 },
      { x: 0.453, y: 0.626 },
      { x: 0.429, y: 0.585 },
    ],
  },
  district4: {
    id: 'district4',
    name: 'District 4',
    shortName: 'Flood Wall',
    blurb: 'Aveline’s edge territory: service roads, hard rain, and pressure building behind sealed doors.',
    accent: '#ff5e9f',
    labelAnchor: { x: 0.585, y: 0.705 },
    polygon: [
      { x: 0.535, y: 0.647 },
      { x: 0.577, y: 0.621 },
      { x: 0.622, y: 0.668 },
      { x: 0.617, y: 0.756 },
      { x: 0.555, y: 0.757 },
      { x: 0.525, y: 0.704 },
    ],
  },
  district5: {
    id: 'district5',
    name: 'District 5 / Cholon',
    shortName: 'Cholon',
    blurb: 'Dense market streets, gray medicine, and long memories layered beneath official suspicion.',
    accent: '#ffb347',
    labelAnchor: { x: 0.475, y: 0.72 },
    polygon: [
      { x: 0.405, y: 0.684 },
      { x: 0.47, y: 0.656 },
      { x: 0.529, y: 0.667 },
      { x: 0.509, y: 0.786 },
      { x: 0.444, y: 0.795 },
      { x: 0.392, y: 0.751 },
    ],
  },
  district2: {
    id: 'district2',
    name: 'District 2',
    shortName: 'Sacrifice Zone',
    blurb: 'Part defended, part abandoned, and always a reminder of what the city chose not to save.',
    accent: '#ffd95e',
    labelAnchor: { x: 0.67, y: 0.57 },
    polygon: [
      { x: 0.571, y: 0.517 },
      { x: 0.74, y: 0.485 },
      { x: 0.838, y: 0.58 },
      { x: 0.834, y: 0.757 },
      { x: 0.681, y: 0.781 },
      { x: 0.619, y: 0.685 },
      { x: 0.597, y: 0.606 },
    ],
  },
}
