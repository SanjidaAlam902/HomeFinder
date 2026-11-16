export function formatBdt(amount) {
  return `৳${Number(amount).toLocaleString("en-BD")}`
}

export function formatRent(amount) {
  return `${formatBdt(amount)} / month`
}

export const BASHUNDHARA_BLOCKS = ["A", "B", "C", "D", "E", "F", "G", "H", "I"]

export const PROPERTY_TYPES = [
  "Flat",
  "Family apartment",
  "Sub-let",
  "Bachelor accommodation",
  "Single room",
]

export const MAP_CENTER = [23.8196, 90.4498]

export const BLOCK_COORDS = {
  A: [23.8232, 90.4412],
  B: [23.821, 90.4454],
  C: [23.8188, 90.4496],
  D: [23.8164, 90.4538],
  E: [23.814, 90.4572],
  F: [23.8118, 90.4508],
  G: [23.8206, 90.4548],
  H: [23.8172, 90.4386],
  I: [23.8254, 90.4478],
}
