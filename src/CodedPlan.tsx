import { useShallow } from 'zustand/react/shallow'
import { useDrawingStore } from './isometric/DrawingStoreHook.ts'
import { cubeLocationFromCuboidValues } from './Store.tsx'
import { coordinatesMap, rotate } from './util.ts'

/**
 * Checks if the numbers in the array are contiguous.
 * @param array - The array.
 * @returns True if the numbers are contiguous or the array has zero or one element, false otherwise.
 */
function areNumbersContiguous(array: Array<number>): boolean {
  for (let index = 0; index < array.length - 1; index++) {
    if (array[index + 1] - array[index] !== 1) return false
  }
  return true
}

/** Represents a coded plan of a structure, this also rotates with the structure. */
export function CodedPlan() {
  const [
    cuboidValues,
    rotation
  ] = useDrawingStore(useShallow((state) => [
    state.cuboidValues,
    state.rotation
  ]))

  let coordinates = cubeLocationFromCuboidValues(cuboidValues).map(({ cuboidIndex, ...rest }) => rest)
  coordinates = rotate(coordinates, rotation)

  // coded plan is a view from the top, flatten y-axis to operate on columns
  const [map, limits] = coordinatesMap('y', coordinates)

  const squares = []
  for (const [XCoordinate, ZYPlane] of Object.entries(map)) {
    for (const [ZCoordinate, YCoordinatesSet] of Object.entries(ZYPlane)) {
      const YCoordinatesArray = [...YCoordinatesSet.values()]
      YCoordinatesArray.sort((a, b) => a - b)

      // for a coded plan to exists, it must have a flat base on the X-Z plane and have no overhangs.
      if (YCoordinatesArray[0] !== 0 || !areNumbersContiguous(YCoordinatesArray)) {
        return null
      }

      // coordinate starts at 0 and height starts at 1
      const height = YCoordinatesArray[YCoordinatesArray.length - 1] + 1

      squares.push(
        <>
          <rect
            x={parseInt(XCoordinate)}
            y={parseInt(ZCoordinate)}
            width={1}
            height={1}
            fill='transparent'
            stroke='black'
            strokeWidth={0.1}
          />
          <text
            x={parseInt(XCoordinate) + 0.5}
            y={parseInt(ZCoordinate) + 0.6}
            textAnchor='middle'
            style={{ fontSize: '0.5px', fontFamily: 'monospace' }}
          >
            {height}
          </text>
        </>
      )
    }
  }

  // add one for height from coordinates, add two for margins
  const pixelWidth = limits.x.max - limits.x.min + 1 + 2
  const pixelHeight = limits.z.max - limits.z.min + 1 + 2

  return (
    <svg width='100%' height='100%' viewBox={`${limits.x.min - 1} ${limits.z.min - 1} ${pixelWidth} ${pixelHeight}`}>
      {...squares}
    </svg>
  )
}
