import type { ReactNode } from 'react'
import type { Coordinates, PositiveAxis } from './../isometric/foreground/IsometricStructure.tsx'
import { coordinatesMap, joinedEndsSVGLineCoordinatesProps } from './../../util.ts'

type LineType = 'solid' | 'dashed' | 'none'

type OrthographicViewProps = {
  from: PositiveAxis
  coordinates: Array<Coordinates>
  offsetX: number
  offsetY: number
}

/**
 * Compares two columns and determine the line type for the line drawn between them.
 * A neighboring column with zero element signals this function to skip.
 * @param self - The main column which is not nullable since it should be iterated from a map.
 * @param other - Neighboring column which may not exist due to sparse array.
 * @returns The line type for the line. May be none where a line should not be drawn.
 */
function determineLineType(self: Set<number>, other: Set<number>|undefined): LineType {
  // there is no other column, this edge is the boundary
  if (other === undefined) return 'solid'
  // other column has processed the edge, no need to draw again
  // zero size does not indicate no other column as coordinates map is sparse
  if (other.size === 0) return 'none'
  // one side extends further than the other
  if (Math.max(...self) !== Math.max(...other)) return 'solid'

  // other column is identical to self, no line is drawn
  // this can be simplified to use asymmetric difference when the target version is lifted
  let matchesElementsInOther = true
  for (const element of self.values()) matchesElementsInOther &&= other.has(element)
  if (matchesElementsInOther && self.size === other.size) return 'none'

  // other column is different from self, there must be a hidden edge behind
  return 'dashed'
}

/**
 * Constructs a line by varying the coordinate on one axis.
 * If the supplied coordinate is p and p is on a varying axis,
 * the line will draw from coordinate p to coordinate p + 1.
 * @param lineType - Style of the line.
 * @param x - X-coordinate to start the line with.
 * @param y - Y-coordinate to start the line with.
 * @param varyX - True to vary x-coordinate, false to vary y-coordinate.
 * @returns The line.
 */
function getLine(lineType: LineType, x: number, y: number, varyX: boolean): ReactNode|null {
  const STROKE_WIDTH = 0.1
  const coordinatesProps = joinedEndsSVGLineCoordinatesProps(1, STROKE_WIDTH, varyX, x, y)

  switch (lineType) {
    case 'solid':
      return <line {...coordinatesProps} stroke='black' strokeWidth={STROKE_WIDTH} />
    case 'dashed':
      return <line {...coordinatesProps} stroke='black' strokeWidth={STROKE_WIDTH} strokeDasharray='0.2' />
    case 'none':
      return null
  }
}

/**
 * Represents an orthographic view from a single axis.
 * Note that this is not a full SVG to allow combining multiple views.
 * Surround with SVG tag to display this single view.
 */
export function OrthographicView({ from, coordinates, offsetX, offsetY }: OrthographicViewProps) {
  // orthographic view can be from any axis, flatten to check for edges by comparing column values
  const [map, limits] = coordinatesMap(from, coordinates)
  const [axisA, axisB] = ['x', 'z', 'y'].filter((axis) => axis !== from) as Array<PositiveAxis>

  // reflect both axes for ZY, and reflect vertically for ZY and XY
  // horizonal reflection for matching the combined layout
  // vertical reflection because the pixel's y-axis is opposite to the coordinates system's y-axis
  const isAReflected = axisA === 'z'
  const isBReflected = axisB === 'y'

  const lines = []
  for (const [ACoordinate, BCPlane] of Object.entries(map)) {
    for (const [BCoordinate, CCoordinatesSet] of Object.entries(BCPlane)) {
      const a = parseInt(ACoordinate)
      const b = parseInt(BCoordinate)

      // relative locations of neighboring columns
      for (const [diffA, diffB] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
        const lineType = determineLineType(CCoordinatesSet, map[a + diffA]?.[b + diffB])

        // if reflected, count from the max and make negative neighbor render on the right, already aligned by counting from maximum
        // otherwise, use coordinate normally, make positive neighbor render on the right, and align with origin using minimum
        const pixelA = isAReflected ? limits[axisA].max - a + (diffA === -1 ? 1 : 0) : a + (diffA === 1 ? 1 : 0) - limits[axisA].min
        const pixelB = isBReflected ? limits[axisB].max - b + (diffB === -1 ? 1 : 0) : b + (diffB === 1 ? 1 : 0) - limits[axisB].min

        // if axis A is unchanged for this neighbor, the neighbor is beside self on axis B
        // to divide between self and this neighbor, a line parallel to axis A should be drawn
        // that means drawing the line will vary the a-coordinate
        lines.push(getLine(lineType, offsetX + pixelA, offsetY + pixelB, diffA === 0))
      }

      // mark the edges around the current column as rendered
      CCoordinatesSet.clear()
    }
  }

  return <>{...lines}</>
}
