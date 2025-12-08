import type { Hex } from 'react-hexgrid'
import { hexToPixel } from './../../../util.ts'

type GridPointProps = {
  hex: Hex
  spacing: number
  radius: number
}

/** Represents the points that forms the grid background. */
export function GridPoint({ hex, spacing, radius }: GridPointProps) {
  const centerPixel = hexToPixel(hex, spacing)
  return <circle fill='black' cx={centerPixel.x} cy={centerPixel.y} r={radius} />
}
