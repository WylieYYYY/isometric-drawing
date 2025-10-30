import type { Hex } from 'react-hexgrid'
import { hexToPixel } from './../../../util.ts'

type GridPointProps = {
  hex: Hex
  spacing: number
  radius: number
}

export function GridPoint({ hex, spacing, radius }: GridPointProps) {
  const centerPixel = hexToPixel(hex, spacing)
  return <circle cx={centerPixel.x} cy={centerPixel.y} r={radius} />
}
