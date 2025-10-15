import type { CubeLocation } from './Store.tsx'
import { useShallow } from 'zustand/react/shallow'
import { AxisArrows } from './AxisArrows.tsx'
import { Cube } from './Cube.tsx'
import { cubeLocationFromCuboidValues, useStore } from './Store.tsx'
import { rotate } from './util.ts'

export type Direction = 0 | 1 | 2 | 3 | 4 | 5
export type PositiveAxis = 'x' | 'y' | 'z'
export type Axis = PositiveAxis | '-x' | '-y' | '-z'
export type Coordinates = { [Property in PositiveAxis]: number }

type IsometricStructureProps = {
  spacing: number
}

/**
 * Gets the axis to move along to reach the other cube if the cube is adjacent.
 * @param x - X-coordinate of the other cube.
 * @param y - Y-coordinate of the other cube.
 * @param z - Z-coordinate of the other cube.
 * @returns Axis to move along to reach the other cube, null if not directly adjacent.
 */
function getAdjacentAxis(x: number, y: number, z: number): Axis|null {
  if (y === 0 && z === 0) {
    if (x === 1) return 'x'
    if (x === -1) return '-x'
  }
  if (x === 0 && z === 0) {
    if (y === 1) return 'y'
    if (y === -1) return '-y'
  }
  if (x === 0 && y === 0) {
    if (z === 1) return 'z'
    if (z === -1) return '-z'
  }
  return null
}

/**
 * Gets the direction of the rhombus relative to the center of the cube that is obscured by the other cube.
 * The given coordinates should be the projected relative coordinates.
 * This function does not handle the case where the coordinates are all zeros.
 * @param x - X-coordinate of the projected relative coordinates.
 * @param y - Y-coordinate of the projected relative coordinates.
 * @param z - Z-coordinate of the projected relative coordinates.
 * @returns Direction of the obscured rhombus, or null if the cube is not obscured.
 */
function getObscureDirection(x: number, y: number, z: number): Direction|null {
  // the projected relative coordinates are not next to the cube, cannot be obscuring
  if ([x, y, z].some((value) => value !== 0 && value !== 1)) return null

  const scratchDirection = x * 4 + y * 2 + z
  if ([2, 3, 5].includes(scratchDirection)) return scratchDirection as 2|3|5

  const directionRotation = [0, 1, 4]
  const rotatedIndex = (directionRotation.indexOf(scratchDirection % 6) + 1) % directionRotation.length
  return directionRotation[rotatedIndex] as 0|1|4
}

/**
 * Represents a structure that is made out of isometric cubes.
 * This coordinates multi-cube rendering.
 */
export function IsometricStructure({ spacing }: IsometricStructureProps) {
  const [
    cuboidValues,
    rotation
  ] = useStore(useShallow((state) => [
    state.cuboidValues,
    state.rotation
  ]))

  let cubeLocations = cubeLocationFromCuboidValues(cuboidValues)
  cubeLocations = rotate(cubeLocations, rotation) as Array<CubeLocation>

  const cubes = []

  // can be optimized by ranking the cube by proximity to viewer first and eliminating cubes as it goes
  for (const { cuboidIndex, x, y, z } of cubeLocations) {
    let skipRendering = false
    const cullFaces: Array<Axis> = []
    const cullObscured: Array<Direction> = []

    for (const { x: otherX, y: otherY, z: otherZ, ..._rest } of cubeLocations) {
      if (x === otherX && y === otherY && z === otherZ) continue

      // relative coordinates to the current cube
      const diffX = otherX - x
      const diffY = otherY - y
      const diffZ = otherZ - z

      const adjacentAxis = getAdjacentAxis(diffX, diffY, diffZ)
      if (adjacentAxis !== null) cullFaces.push(adjacentAxis)

      const minDiffXYZ = Math.min(diffX, diffY, diffZ)
      // no planar movement can obscure the cube if the other cube is behind in any axis
      if (minDiffXYZ < 0) continue

      // projected relative coordinates, this will be just in front of the cube if the other cube obscures it
      const obscureNormalizedX = diffX - minDiffXYZ
      const obscureNormalizedY = diffY - minDiffXYZ
      const obscureNormalizedZ = diffZ - minDiffXYZ
      // the other cube fully obscures this cube, don't render at all
      if (obscureNormalizedX === 0 && obscureNormalizedY === 0 && obscureNormalizedZ === 0) {
        skipRendering = true
        break
      }

      const obscureDirection = getObscureDirection(obscureNormalizedX, obscureNormalizedY, obscureNormalizedZ)
      if (obscureDirection !== null) cullObscured.push(obscureDirection)
    }

    if (skipRendering) continue

    // this assumes the culled face means there is an adjacent cube there, which is true
    const uncullLEdges: Array<PositiveAxis> = []
    if (cullFaces.includes('z') && cullFaces.includes('y')) uncullLEdges.push('x')
    if (cullFaces.includes('x') && cullFaces.includes('z')) uncullLEdges.push('y')
    if (cullFaces.includes('x') && cullFaces.includes('y')) uncullLEdges.push('z')

    cubes.push(
      <Cube
        cuboidIndex={cuboidIndex}
        x={x} y={y} z={z}
        spacing={spacing}
        cullFaces={cullFaces}
        uncullLEdges={uncullLEdges}
        cullObscured={cullObscured}
      />)
  }

  return (
    <>
      <AxisArrows spacing={spacing} coordinates={cubeLocations.map(({ cuboidIndex, ...rest}) => rest)} />
      {...cubes}
    </>
  )
}
