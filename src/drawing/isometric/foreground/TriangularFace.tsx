import type { Direction, PositiveAxis } from './IsometricStructure.tsx'
import type { CubeLocation, HighlightKind } from './../../../Store.tsx'
import { Hex, HexUtils } from 'react-hexgrid'
import { useShallow } from 'zustand/react/shallow'
import { useDrawingStore } from './../../DrawingStoreHook.ts'
import { useStore } from './../../../Store.tsx'
import { hexToPixel, rotate } from './../../../util.ts'

type TriangularFaceProps = {
  spacing: number
  cubeLocation: CubeLocation
  startDirection: Direction
  highlightedCubeFaceMap: Record<PositiveAxis, HighlightKind|null>
}

/**
 * Represents half of a face of an isometric cube, the triangles are radial from the center of the cube's hex origin.
 * This allows culling by removing and adding triangular faces without calculating the unobscured face vertices manually.
 */
export function TriangularFace({ spacing, cubeLocation, startDirection, highlightedCubeFaceMap }: TriangularFaceProps) {
  const highlightKind = useStore((state) => state.highlightKind)
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
    x: newCubeCoordinates.x.toString(),
    y: newCubeCoordinates.y.toString(),
    z: newCubeCoordinates.z.toString(),
    dx: '1', dy: '1', dz: '1'
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
      fill={fill}
      fillOpacity={highlightedCubeFaceMap[faceAxis] !== null ? 0.5 : 0}
      onClick={onClickCallback}
      onMouseOver={() => highlightCubeFace({ cuboidIndex, x, y, z }, faceAxis)}
      onMouseOut={() => unhighlightCubeFace(highlightKind, { cuboidIndex, x, y, z })}
    />
  )
}
