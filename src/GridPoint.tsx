import { Hex } from 'react-hexgrid'

type GridPointProps = {
  hex: Hex
  spacing: number
  radius: number
}

function hexToPixel(hex: Hex, spacing: number): { x: number, y: number } {
    const x = hex.q * (3 / 2) * 0.1
    const y = (hex.r - hex.s) * (Math.sqrt(3) / 2) * 0.1
    return { x: x * spacing, y: y * spacing }
}

export function GridPoint({ hex, spacing, radius }: GridPointProps) {
  const centerPixel = hexToPixel(hex, spacing)
  return <circle cx={centerPixel.x} cy={centerPixel.y} r={radius} />
}
