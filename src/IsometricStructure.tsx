import type { CubeLocation } from './Store.tsx'
import { useShallow } from 'zustand/react/shallow'
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

function getObscureDirection(x: number, y: number, z: number): Direction|null {
  if ([x, y, z].some((value) => value !== 0 && value !== 1)) return null

  const scratchDirection = x * 4 + y * 2 + z
  if ([2, 3, 5].includes(scratchDirection)) return scratchDirection as 2|3|5

  const directionRotation = [0, 1, 4]
  const rotatedIndex = (directionRotation.indexOf(scratchDirection % 6) + 1) % directionRotation.length
  return directionRotation[rotatedIndex] as 0|1|4
}

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

  for (const { cuboidIndex, x, y, z } of cubeLocations) {
    let skipRendering = false
    const cullFaces: Array<Axis> = []
    const cullObscured: Array<Direction> = []

    for (const { x: otherX, y: otherY, z: otherZ, ..._rest } of cubeLocations) {
      if (x === otherX && y === otherY && z === otherZ) continue

      const diffX = otherX - x
      const diffY = otherY - y
      const diffZ = otherZ - z

      const adjacentAxis = getAdjacentAxis(diffX, diffY, diffZ)
      if (adjacentAxis !== null) cullFaces.push(adjacentAxis)

      const minDiffXYZ = Math.min(diffX, diffY, diffZ)
      if (minDiffXYZ < 0) continue

      const obscureNormalizedX = diffX - minDiffXYZ
      const obscureNormalizedY = diffY - minDiffXYZ
      const obscureNormalizedZ = diffZ - minDiffXYZ
      if (obscureNormalizedX === 0 && obscureNormalizedY === 0 && obscureNormalizedZ === 0) {
        skipRendering = true
        break
      }

      const obscureDirection = getObscureDirection(obscureNormalizedX, obscureNormalizedY, obscureNormalizedZ)
      if (obscureDirection !== null) cullObscured.push(obscureDirection)
    }

    if (skipRendering) continue

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

  return <>{...cubes}</>
}
