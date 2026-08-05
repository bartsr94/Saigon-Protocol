import type { EquipmentItem, Skill } from '../stores/characterStore'

export interface Archetype {
  id: string
  name: string
  career: string
  blurb: string
  skills: Skill[]
  equipment: EquipmentItem[]
  careerEvent: string
}

export const ARCHETYPES: Archetype[] = [
  {
    id: 'ex-corpo-security',
    name: 'Ex-Corpo Security',
    career: 'Corporate Security',
    blurb:
      'You walked a checkpoint for a megacorp until your contract got "restructured." You kept the reflexes.',
    skills: [
      { name: 'Gun Combat', level: 1 },
      { name: 'Tactics', level: 1 },
      { name: 'Athletics', level: 1 },
      { name: 'Streetwise', level: 0 },
    ],
    equipment: [
      { name: 'Sidearm', quantity: 1 },
      { name: 'Ballistic Vest', quantity: 1 },
      { name: 'Revoked Corp ID', quantity: 1 },
    ],
    careerEvent: 'Contract terminated without severance after a shift-floor incident.',
  },
  {
    id: 'pmc-operator',
    name: 'PMC Operator',
    career: 'Private Military Contractor',
    blurb:
      'You worked a rifle for whoever was paying along the Thai-Cambodian frontier. The war never ended, it just changed clients.',
    skills: [
      { name: 'Gun Combat', level: 1 },
      { name: 'Heavy Weapons', level: 1 },
      { name: 'Tactics', level: 1 },
      { name: 'Survival', level: 0 },
    ],
    equipment: [
      { name: 'Rifle', quantity: 1 },
      { name: 'Combat Rig', quantity: 1 },
      { name: 'Encrypted Comms Unit', quantity: 1 },
    ],
    careerEvent: 'Squad disbanded when the contract funding dried up.',
  },
  {
    id: 'street-fixer',
    name: 'Street Fixer',
    career: 'Fixer',
    blurb:
      'You know who needs what, who has it, and who to avoid. Half your job is a conversation, the other half is knowing when to end it.',
    skills: [
      { name: 'Streetwise', level: 1 },
      { name: 'Persuade', level: 1 },
      { name: 'Deception', level: 1 },
      { name: 'Bribery', level: 0 },
    ],
    equipment: [
      { name: 'Burner Deck', quantity: 1 },
      { name: 'Contact List', quantity: 1 },
      { name: 'Concealed Blade', quantity: 1 },
    ],
    careerEvent: 'A deal went bad and you burned a contact getting out clean.',
  },
  {
    id: 'netrunner',
    name: 'Netrunner',
    career: 'Independent Netrunner',
    blurb:
      "You're most yourself somewhere behind a firewall that isn't yours. The SEZ's corpo networks are full of doors nobody bothered to lock right.",
    skills: [
      { name: 'Hacking', level: 1 },
      { name: 'Electronics', level: 1 },
      { name: 'Investigate', level: 1 },
      { name: 'Stealth', level: 0 },
    ],
    equipment: [
      { name: 'Rig Deck', quantity: 1 },
      { name: 'Encrypted Drives', quantity: 1 },
      { name: 'Signal Jammer', quantity: 1 },
    ],
    careerEvent: 'Tripped a corpo intrusion alarm and went dark for six months.',
  },
  {
    id: 'field-medic',
    name: 'Field Medic',
    career: 'Field Medic',
    blurb:
      "You patched up whoever was bleeding, corpo or resistance, and didn't ask which side they were on. Not everyone appreciated that.",
    skills: [
      { name: 'Medic', level: 1 },
      { name: 'Admin', level: 1 },
      { name: 'Persuade', level: 0 },
      { name: 'Streetwise', level: 0 },
    ],
    equipment: [
      { name: 'Trauma Kit', quantity: 1 },
      { name: 'Field Diagnostics Scanner', quantity: 1 },
      { name: 'Pharma Stock', quantity: 1 },
    ],
    careerEvent: 'Lost a clinic license after treating the wrong patient.',
  },
  {
    id: 'delta-drifter',
    name: 'Delta Drifter',
    career: 'Delta Drifter',
    blurb:
      "You grew up on the drowned edge of the Mekong, salvaging and fishing waters nobody officially claims. The SEZ is louder than home, but the instincts still work.",
    skills: [
      { name: 'Survival', level: 1 },
      { name: 'Mechanic', level: 1 },
      { name: 'Stealth', level: 1 },
      { name: 'Athletics', level: 0 },
    ],
    equipment: [
      { name: 'Patched Skiff Kit', quantity: 1 },
      { name: 'Fishing Spear', quantity: 1 },
      { name: 'Water Filter Rig', quantity: 1 },
    ],
    careerEvent: 'Came upriver into the SEZ when the salvage dried up.',
  },
]
