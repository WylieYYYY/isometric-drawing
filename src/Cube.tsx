import type { Axis, Direction, PositiveAxis } from './IsometricStructure.tsx'
import { Hex, HexUtils, Path } from 'react-hexgrid'
import { axisIntoParts } from './IsometricStructure.tsx'

type CubeProps = {
  x: number
  y: number
  z: number
  cullFaces: Array<Axis>
  uncullLEdges: Array<PositiveAxis>
  cullObscured: Array<Direction>
}

const cullFacePredicateMap = {
  x: (direction: number) => [0, 1, 5].includes(direction),
  y: (direction: number) => [1, 2, 3].includes(direction),
  z: (direction: number) => [3, 4, 5].includes(direction)
}

const commonPathProps = {
  stroke: 'black',
  strokeWidth: 0.05
}

function shouldCull(
  isCullableFace: boolean,
  isCullableObscured: boolean,
  isUncullableLEdge: boolean = false
): boolean {
  return (isCullableFace && !isUncullableLEdge) || isCullableObscured
}

export function Cube({ x, y, z, cullFaces, uncullLEdges, cullObscured }: CubeProps) {
  const hexOrigin = new Hex(x - z, z - y, y - x)

  function originPlusDirection(direction: number): Hex {
    return HexUtils.add(hexOrigin, HexUtils.direction(direction))
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
      {...prongs}
      {...outlines}
    </>
  )
}
