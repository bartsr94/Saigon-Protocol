import type { LocationMeta } from '../stores/navigationStore'
import { assertUniqueIds } from './uniqueId'

export const LOCATIONS: LocationMeta[] = [
  {
    id: 'district7-pier14',
    name: 'Pier 14, District 7',
    blurb: 'A rain-slicked cargo pier on the edge of the SEZ. Your contact is waiting.',
    thumbnail: '',
  },
]

assertUniqueIds('location', LOCATIONS, (l) => l.id)
