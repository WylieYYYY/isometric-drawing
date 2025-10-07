import type { Axis,  Direction, PositiveAxis } from './IsometricStructure.tsx'
import type { CubeLocation } from './Store.tsx'
import { Hex, HexUtils, Path } from 'react-hexgrid'
import { useShallow } from 'zustand/react/shallow'
import { isCubeFaceHighlighted, useStore } from './Store.tsx'
import { hexToPixel, rotate } from './util.ts'

type CubeProps = {
  spacing: number
  cullFaces: Array<Axis>
  uncullLEdges: Array<PositiveAxis>
  cullObscured: Array<Direction>
} & CubeLocation

const cullFacePredicateMap = {
  x: (direction: number) => [0, 1, 5].includes(direction),
  y: (direction: number) => [1, 2, 3].includes(direction),
  z: (direction: number) => [3, 4, 5].includes(direction)
}

const commonPathProps = {
  stroke: 'black',
  strokeWidth: 0.05
}

function axisIntoParts(axis: Axis): { isPositive: boolean, absAxis: PositiveAxis } {
  if (axis.length === 1) return { isPositive: true, absAxis: axis as PositiveAxis }
  return { isPositive: false, absAxis: axis.charAt(1) as PositiveAxis }
}

function shouldCull(
  isCullableFace: boolean,
  isCullableObscured: boolean,
  isUncullableLEdge: boolean = false
): boolean {
  return (isCullableFace && !isUncullableLEdge) || isCullableObscured
}

export function Cube({ cuboidIndex, x, y, z, spacing, cullFaces, uncullLEdges, cullObscured }: CubeProps) {
  const [
    highlightedTarget,
    highlightCubeFace,
    unhighlightCubeFace,
    newCuboidValue,
    rotation
  ]= useStore(useShallow((state) => [
    state.highlightedTarget,
    state.highlightCubeFace,
    state.unhighlightCubeFace,
    state.newCuboidValue,
    state.rotation
  ]))

  const highlightedCubeFaceMap = Object.fromEntries(['x', 'y', 'z'].map((axis) => {
    return [axis, isCubeFaceHighlighted(highlightedTarget, { cuboidIndex, x, y, z }, axis as PositiveAxis)]
  }))

  const hexOrigin = new Hex(x - z, z - y, y - x)

  function originPlusDirection(direction: number): Hex {
    return HexUtils.add(hexOrigin, HexUtils.direction(direction))
  }

  const faces = []
  for (let startDirection = 0; startDirection < 6; startDirection++) {
    const endDirection = (startDirection + 1) % 6

    function shouldCullObscured(obscuredDirection: Direction): boolean {
      return startDirection === obscuredDirection || endDirection === obscuredDirection
    }

    if (cullObscured.some(shouldCullObscured)) continue

    const centerPixel = hexToPixel(hexOrigin, spacing)
    const startPixel = hexToPixel(originPlusDirection(startDirection), spacing)
    const endPixel = hexToPixel(originPlusDirection(endDirection), spacing)
    const points = `${centerPixel.x}, ${centerPixel.y} ${startPixel.x}, ${startPixel.y} ${endPixel.x}, ${endPixel.y}`

    let newCubeCoordinates = { x, y, z }
    const faceAxis = 'xyz'.charAt(Math.floor((startDirection + 1) % 6 / 2)) as PositiveAxis
    newCubeCoordinates[faceAxis]++

    newCubeCoordinates = rotate([newCubeCoordinates], rotation.inverse())[0]

    const cuboidValue = {
      x: newCubeCoordinates.x.toString(),
      y: newCubeCoordinates.y.toString(),
      z: newCubeCoordinates.z.toString(),
      dx: '1', dy: '1', dz: '1'
    }

    let fill
    switch (highlightedCubeFaceMap[faceAxis]) {
      case 'cuboid':
        fill = 'red'
        break
      case 'face':
        fill = 'green'
        break
      case null:
        fill = undefined
        break
    }

    faces.push(
      <polygon
        points={points}
        fill={fill}
        fillOpacity={highlightedCubeFaceMap[faceAxis] !== null ? 0.5 : 0}
        onClick={() => newCuboidValue(cuboidValue)}
        onMouseOver={() => highlightCubeFace({ cuboidIndex, x, y, z }, faceAxis)}
        onMouseOut={() => unhighlightCubeFace({ cuboidIndex, x, y, z })}
      />
    )
  }

  const prongs = []
  for (let direction = 1; direction < 6; direction += 2) {
    function shouldCullFace(axis: Axis): boolean {
      const { isPositive, absAxis } = axisIntoParts(axis)
      return isPositive && cullFacePredicateMap[absAxis](direction)
    }

    function shouldCullObscured(obscuredDirection: Direction): boolean {
      if (direction % 2 === 0) {
        return (obscuredDirection + 1) % 6 === direction || (obscuredDirection + 5) % 6 === direction
      } else {
        return obscuredDirection === direction
      }
    }

    function shouldUncullLEdge(axis: PositiveAxis): boolean {
      return (axis === 'z' && direction === 1) || (axis === 'x' && direction === 3) || (axis === 'y' && direction === 5)
    }

    if (shouldCull(cullFaces.some(shouldCullFace), cullObscured.some(shouldCullObscured), uncullLEdges.some(shouldUncullLEdge))) continue
    prongs.push(
      <Path
        start={hexOrigin}
        end={originPlusDirection(direction)}
        {...commonPathProps}
      />
    )
  }

  const outlines = []
  for (let startDirection = 0; startDirection < 6; startDirection++) {
    const endDirection = (startDirection + 1) % 6

    function shouldCullFace(axis: Axis): boolean {
      const { isPositive, absAxis } = axisIntoParts(axis)
      const cullingPredicate = cullFacePredicateMap[absAxis]

      if (isPositive) {
        return cullingPredicate(startDirection) && cullingPredicate(endDirection)
      } else {
        return !cullingPredicate(startDirection) && !cullingPredicate(endDirection)
      }
    }

    function shouldCullObscured(obscuredDirection: Direction): boolean {
      return startDirection === obscuredDirection || endDirection === obscuredDirection
    }

    if (shouldCull(cullFaces.some(shouldCullFace), cullObscured.some(shouldCullObscured))) continue
    outlines.push(
      <Path
        start={originPlusDirection(startDirection)}
        end={originPlusDirection(endDirection)}
        {...commonPathProps}
      />
    )
  }

  return (
    <>
      {...faces}
      {...prongs}
      {...outlines}
    </>
  )
}
