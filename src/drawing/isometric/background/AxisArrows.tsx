import type { Coordinates, Direction, PositiveAxis } from './../foreground/IsometricStructure.tsx'
import { HexUtils, Path } from 'react-hexgrid'
import { useDrawingStore } from './../../DrawingStoreHook.ts'
import { directionalHex, hexToPixel } from './../../../util.ts'

type AxisArrowsProps = {
  spacing: number
  coordinates: Array<Coordinates>
  axisEndCoordinates: Coordinates
}

/** Map of positive axes to their conventional display colors. */
const axisColorMap = {
  x: 'red',
  y: 'limegreen',
  z: 'blue'
}

/**
 * Converts an set of coordinates that obscure the axis into non-zero length unobscured spans.
 * An obscure set of [2, 3, 5, 8] with and end coordinate of 11
 * yieds spans of (0, 1), (6, 7) and (9, 11) which is returned as [0, 1, 6, 7, 9, 11].
 * The spans calculation start at zero.
 * @param obscureSet - Set of coordinates that obscures the axis.
 * @param end - This is the second component of the final span, the first component is the
 *  final unobscured coordinate. So this number should be larger than the numbers in the set.
 * @returns Spans representation of the unobscured coordinates.
 */
function makeSegments(obscureSet: Set<number>, end: number): Array<number> {
  const obscureArray = [...obscureSet.values()]
  obscureArray.sort((a, b) => a - b)

  const segments = []
  let nearestObscure = -1

  for (const coordinate of obscureArray) {
    // if nearest is directly under, then there is no gap for segment
    // if it is two under, then the segment will have zero length, which is skipped
    if (nearestObscure !== coordinate - 1 && nearestObscure + 1 !== coordinate - 1) {
      segments.push(nearestObscure + 1)
      segments.push(coordinate - 1)
    }
    nearestObscure = coordinate
  }

  // assume that a last segment can be made with the end
  segments.push(nearestObscure + 1)
  segments.push(end)

  return segments
}

/** Represents the arrows that mark the axes. */
export function AxisArrows({ spacing, coordinates, axisEndCoordinates }: AxisArrowsProps) {
  const shouldShowIsometricStructure = useDrawingStore((state) => state.shouldShowIsometricStructure)

  const obscureSets = { x: new Set<number>(), y: new Set<number>(), z: new Set<number>() }
  for (const { x, y, z } of coordinates) {
    // no planar movement can obscure any arrow if any coordinate is behind on any axis
    // project the coordinates onto the axes if it is visually on them
    // does not match axis-adjacent obscuring coordinates as that will complicate the logic greatly
    // so there is a overlapping render if the arrow is only obscured by edges and not faces
    if (x >= 0 && y >= 0 && z >= 0) {
      if (y === z && x - y >= 0) obscureSets.x.add(x - y)
      if (x === z && y - x >= 0) obscureSets.y.add(y - x)
      if (x === y && z - x >= 0) obscureSets.z.add(z - x)
    }
  }

  // arrow is a combination of dashed line, triangular arrow head and text label
  const arrows = []
  for (const [index, axis] of ['x', 'y', 'z'].entries() as ArrayIterator<[number, PositiveAxis]>) {
    const axisDirection = index * 2 as Direction

    // make sure the arrow is not obscured, it needs to extend 2 units beyond the origin
    const hexes = makeSegments(shouldShowIsometricStructure ? obscureSets[axis] : new Set(), axisEndCoordinates[axis] + 2)
        .map((coordinate) => directionalHex(axisDirection, coordinate))
    const color = axisColorMap[axis]

    // segments are consist of pairs of hexes
    for (let windowIndex = 0; windowIndex < hexes.length; windowIndex += 2) {
      arrows.push(<Path start={hexes[windowIndex]} end={hexes[windowIndex + 1]} stroke={color} strokeWidth={0.05} strokeDasharray='0.1' />)
    }

    // pixel that is at the center of the end hex, hexes has a minimum of two hexes in it
    const endPixel = hexToPixel(hexes[hexes.length - 1], spacing)
    // trianglular arrow head that can be used on all axes
    const arrowHeadPoints = `${endPixel.x}, ${endPixel.y - (3 / 2) * 0.05} ` +
        `${endPixel.x - Math.sqrt(3) * 0.05}, ${endPixel.y + (3 / 2) * 0.05} ` +
        `${endPixel.x + Math.sqrt(3) * 0.05}, ${endPixel.y + (3 / 2) * 0.05}`

    // center pixel for text is further than center pixel of end hex
    const textPixel = hexToPixel(HexUtils.add(hexes[hexes.length - 1], directionalHex(axisDirection, 0.5)), spacing)

    arrows.push(
      <>
        <polygon points={arrowHeadPoints} fill={color} />
        <text textAnchor='middle' x={textPixel.x} y={textPixel.y} fill={color} style={{ fontSize: '0.3px', fontFamily: 'monospace' }}>{axis.toUpperCase()}</text>
      </>
    )
  }

  return <>{...arrows}</>
}
