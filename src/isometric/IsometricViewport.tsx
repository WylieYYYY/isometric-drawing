import type { Coordinates, Direction, PositiveAxis } from './foreground/IsometricStructure.tsx'
import type { CubeLocation } from './../Store.tsx'
import { GridGenerator, Hex, HexGrid, Layout } from 'react-hexgrid'
import { useShallow } from 'zustand/react/shallow'
import { AxisArrows } from './background/AxisArrows.tsx'
import { GridPoint } from './background/GridPoint.tsx'
import { IsometricStructure } from './foreground/IsometricStructure.tsx'
import { cubeLocationFromCuboidValues } from './../Store.tsx'
import { useDrawingStore } from './DrawingStoreHook.ts'
import { directionalHex, hexToPixel, rotate, updateMinMax } from './../util.ts'

type ViewBox = {
  x: number
  y: number
  width: number
  height: number
}

type IsometricViewportProps = {
  shouldShowGrid: boolean
  shouldShowAxisArrows: boolean
  size?: {
    width: number
    height: number
    viewBox: string
  }
}

/**
 * Calculates the end coordinates of the axis arrows, compacted.
 * The returned coordinates are to be interpreted axis by axis separately,
 * so the real coordinates represented here are: (x, 0, 0), (0, y, 0) and (0, 0, z).
 * @param coordinates - Coordinates of the cubes.
 * @returns The compacted coordinates.
 */
function calculateAxisEndCoordinates(coordinates: Array<Coordinates>): Coordinates {
  return coordinates.reduce((axisEndCoordinates, { x, y, z }) => {
    // calculate where the coordinates are visually on the axes
    // so that the axes do not over extend when the coordinates are large but not away from center of viewport
    const { x: axisEndX, y: axisEndY, z: axisEndZ } = axisEndCoordinates
    const visualX = x - y
    const visualY = Math.ceil(y - (x + z) / 2)
    const visualZ = z - y

    return {
      x: Math.max(axisEndX, visualX),
      y: Math.max(axisEndY, visualY),
      z: Math.max(axisEndZ, visualZ)
    }
  }, { x: 0, y: 0, z: 0 })
}

/**
 * Calculates a view box that contains all cubes and axis arrows without overflowing.
 * @param spacing - Spacing as specified in react-hexgrid.
 * @param axisEndCoordinates - End coordinates of the axis arrows, compacted.
 * @param cubeLocations - The cube locations.
 * @returns Calculated view box in its components, for deriving width and height.
 */
function autoViewBox(spacing: number, axisEndCoordinates: Coordinates, cubeLocations: Array<CubeLocation>): ViewBox {
  // good looking margin, no formula just personal preference
  const margin = 4 * spacing * 0.1

  // consider the boundary set by the cube locations
  const minMaxPixel = cubeLocations.reduce((minMaxPixel, { x, y, z }) => {
    // center of cube rendering, same as the one used in cube
    const hexOriginPixel = hexToPixel(new Hex(x - z, z - y, y - x), spacing)
    updateMinMax(minMaxPixel, hexOriginPixel)
    return minMaxPixel
  }, { x: { min: Infinity, max: -Infinity }, y: { min: Infinity, max: -Infinity } })

  // consider the boundary set by the axis arrows
  const minMaxPixelWithAxisEnd = minMaxPixel
  for (let index = 0; index < 3; index++) {
    const axis = 'xyz'.charAt(index) as PositiveAxis
    // extra unit allocated for text at the end of arrows
    const extendedEndHex = directionalHex(index * 2 as Direction, axisEndCoordinates[axis] + 1)
    const extendedEndPixel = hexToPixel(extendedEndHex, spacing)
    updateMinMax(minMaxPixelWithAxisEnd, extendedEndPixel)
  }

  return {
    x: minMaxPixelWithAxisEnd.x.min - margin,
    y: minMaxPixelWithAxisEnd.y.min - margin,
    width: minMaxPixelWithAxisEnd.x.max - minMaxPixelWithAxisEnd.x.min + margin * 2,
    height: minMaxPixelWithAxisEnd.y.max - minMaxPixelWithAxisEnd.y.min + margin * 2
  }
}

/**
 * Viewport that contains everything that is considered a part of an isometric drawing.
 * Handles the sizing of the drawing area and background features.
 * Main drawing is handled by the structure component.
 */
export function IsometricViewport({ shouldShowGrid, shouldShowAxisArrows, size }: IsometricViewportProps) {
  const [
    cuboidValues,
    rotation
  ] = useDrawingStore(useShallow((state) => [
    state.cuboidValues,
    state.rotation
  ]))

  const generator = shouldShowGrid ? GridGenerator.hexagon(20) : []

  let cubeLocations = cubeLocationFromCuboidValues(cuboidValues)
  cubeLocations = rotate(cubeLocations, rotation) as Array<CubeLocation>

  const coordinates = cubeLocations.map(({ cuboidIndex, ...rest}) => rest)
  const axisEndCoordinates = calculateAxisEndCoordinates(coordinates)

  const newSize = {
    width: size?.width,
    height: size?.height,
    viewBox: size?.viewBox
  }

  if (size === undefined) {
    const { x, y, width, height } = autoViewBox(4, axisEndCoordinates, cubeLocations)
    // same scale as the self-defined size (600 / 40 = 15), can be lifted as a prop
    newSize.width = width * 15
    newSize.height = height * 15
    newSize.viewBox = `${x} ${y} ${width} ${height}`
  }

  return (
    <HexGrid viewBox={newSize.viewBox} style={{ width: newSize.width, height: newSize.height }}>
      <Layout size={{ x: 0.1, y: 0.1 }} spacing={4}>
        {
          generator.map((hex, key) => (
            <GridPoint
              key={key}
              hex={hex}
              spacing={4}
              radius={0.05}
            />
          ))
        }
        {
          shouldShowAxisArrows ? (
            <AxisArrows
              spacing={4}
              coordinates={coordinates}
              axisEndCoordinates={axisEndCoordinates}
            />
          ) : null
        }
        <IsometricStructure spacing={4} cubeLocations={cubeLocations} />
      </Layout>
    </HexGrid>
  )
}
