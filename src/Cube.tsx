import { Hex, HexUtils, Path } from 'react-hexgrid'

type CubeProps = {
  x: number
  y: number
  z: number
  cullFaces: Array<'x'|'y'|'z'|'-x'|'-y'|'-z'>
  uncullLEdges: Array<'x'|'z'>
  cullObscured: Array<0|1|2|3|4|5>
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
    function shouldCullFace(axis: 'x'|'y'|'z'|'-x'|'-y'|'-z'): boolean {
      return !axis.startsWith('-') && cullFacePredicateMap[axis](direction)
    }

    function shouldCullObscured(obscuredDirection: 0|1|2|3|4|5): boolean {
      if (direction % 2 === 0) {
        return (obscuredDirection + 1) % 6 === direction || (obscuredDirection + 5) % 6 === direction
      } else {
        return obscuredDirection === direction
      }
    }

    function shouldUncullLEdge(axis: 'x'|'z'): boolean {
      return (axis === 'x' && direction === 1) || (axis === 'z' && direction === 3)
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

    function shouldCullFace(axis: 'x'|'y'|'z'|'-x'|'-y'|'-z'): boolean {
      const cullingPredicate = cullFacePredicateMap[axis.slice(-1)]
      if (axis.startsWith('-')) {
        return !cullingPredicate(startDirection) && !cullingPredicate(endDirection)
      } else {
        return cullingPredicate(startDirection) && cullingPredicate(endDirection)
      }
    }

    function shouldCullObscured(obscuredDirection: 0|1|2|3|4|5): boolean {
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
