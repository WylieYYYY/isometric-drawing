import type { Direction, PositiveAxis } from './IsometricStructure.tsx'
import type { CubeLocation, HighlightKind } from './../../../Store.tsx'
import { Hex, HexUtils } from 'react-hexgrid'
import { useShallow } from 'zustand/react/shallow'
import { useDrawingStore } from './../../DrawingStoreHook.ts'
import { useStore } from './../../../Store.tsx'
import { hexToPixel, rotate } from './../../../util.ts'

type TriangularFaceProps = {
  /** Current highlighting, `cuboid` for delete action, `face` for build action. */
  highlightKind: HighlightKind
  /** Spacing as specified in react-hexgrid. */
  spacing: number
  /** Cuboid index for deletion, coordinates for offseting drawing and creating new cubes. */
  cubeLocation: CubeLocation
  /**
   * Triangular face spans two directions around the cube.
   * Yields the other direction with (startDirection + 1) % 6.
   */
  startDirection: Direction
  /* Map of face axis to what kind of highlighting is applied to that face. */
  highlightedCubeFaceMap: Record<PositiveAxis, HighlightKind|null>
}

/**
 * Represents half of a face of an isometric cube, the triangles are radial from the center of the cube's hex origin.
 * This allows culling by removing and adding triangular faces without calculating the unobscured face vertices manually.
 */
export function TriangularFace({ highlightKind, spacing, cubeLocation, startDirection, highlightedCubeFaceMap }: TriangularFaceProps) {
  // using the store here is okay as `supportsHover` defaults to true
  // it stays true if there is no application controlling it
  const supportsHover = useStore((state) => state.supportsHover)
  const [
    highlightCubeFace,
    unhighlightCubeFace,
    newCuboidValue,
    deleteCuboidValue,
    rotation
  ]= useDrawingStore(useShallow((state) => [
    state.highlightCubeFace,
    state.unhighlightCubeFace,
    state.newCuboidValue,
    state.deleteCuboidValue,
    state.rotation
  ]))

  const { cuboidIndex, x, y, z } = cubeLocation
  const endDirection = (startDirection + 1) % 6

  // center of cube rendering, same as the one used in cube
  const hexOrigin = new Hex(x - z, z - y, y - x)

  // adding origin by a unit hex of the given direction will give a hex of a vertex of this cube
  // same as the one used in cube
  function originPlusDirection(direction: number): Hex {
    return HexUtils.add(hexOrigin, HexUtils.direction(direction))
  }

  const centerPixel = hexToPixel(hexOrigin, spacing)
  const startPixel = hexToPixel(originPlusDirection(startDirection), spacing)
  const endPixel = hexToPixel(originPlusDirection(endDirection), spacing)
  const points = `${centerPixel.x}, ${centerPixel.y} ${startPixel.x}, ${startPixel.y} ${endPixel.x}, ${endPixel.y}`

  // transformed rendering coordinates
  let newCubeCoordinates = { x, y, z }
  const faceAxis = 'xyz'.charAt(Math.floor(endDirection / 2)) as PositiveAxis
  newCubeCoordinates[faceAxis]++

  // undo transformation for storage
  newCubeCoordinates = rotate([newCubeCoordinates], rotation.inverse())[0]

  const cuboidValue = {
    x: newCubeCoordinates.x,
    y: newCubeCoordinates.y,
    z: newCubeCoordinates.z,
    dx: 1, dy: 1, dz: 1
  }

  let fill, onClickCallback
  switch (highlightedCubeFaceMap[faceAxis]) {
    case 'cuboid':
      fill = 'red'
      onClickCallback = () => deleteCuboidValue(cuboidIndex)
      break
    case 'face':
      fill = 'green'
      onClickCallback = () => newCuboidValue(cuboidValue)
      break
    case null:
      fill = undefined
      onClickCallback = undefined
      break
  }

  return (
    <polygon
      points={points}
      fill={supportsHover ? fill : 'transparent'}
      fillOpacity={highlightedCubeFaceMap[faceAxis] !== null ? 0.5 : 0}
      onClick={onClickCallback}
      onMouseOver={() => highlightCubeFace({ cuboidIndex, x, y, z }, faceAxis)}
      onMouseOut={() => unhighlightCubeFace(highlightKind, { cuboidIndex, x, y, z })}
    />
  )
}
