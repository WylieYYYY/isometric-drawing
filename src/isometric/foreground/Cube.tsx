import type { Axis,  Direction, PositiveAxis } from './IsometricStructure.tsx'
import type { CubeLocation, HighlightKind } from './../../Store.tsx'
import { Hex, HexUtils, Path } from 'react-hexgrid'
import { useDrawingStore } from './../DrawingStoreHook.ts'
import { isCubeFaceHighlighted, useStore } from './../../Store.tsx'
import { TriangularFace } from './TriangularFace.tsx'

type CubeProps = {
  spacing: number
  cullFaces: Array<Axis>
  uncullLEdges: Array<PositiveAxis>
  cullObscured: Array<Direction>
} & CubeLocation

/**
 * Map of positive axes to predicate functions that determine whether a vertex of the given direction
 * belongs to the face of the given positive axis.
 */
const cullFacePredicateMap = {
  x: (direction: number) => [0, 1, 5].includes(direction),
  y: (direction: number) => [1, 2, 3].includes(direction),
  z: (direction: number) => [3, 4, 5].includes(direction)
}

/** Properties that are applied to all paths, these are SVG path element properties not CSS styles. */
const commonPathProps = {
  stroke: 'black',
  strokeWidth: 0.05
}

/**
 * Decomposes an axis into a boolean indicating whether the given axis is positive
 * and a positive axis that is parallel or anti-parallel to the original axis.
 * @param axis - Axis to be decomposed.
 * @returns Object containing the boolean and the positive axis.
 */
function axisIntoParts(axis: Axis): { isPositive: boolean, absAxis: PositiveAxis } {
  if (axis.length === 1) return { isPositive: true, absAxis: axis as PositiveAxis }
  return { isPositive: false, absAxis: axis.charAt(1) as PositiveAxis }
}

/**
 * Determines whether a component should be culled based on the priority of the calculated conditions.
 * @param isCullableFace - Calculated cull condition for the component based on whether face is culled.
 * @param isCullableObscured - Calculated cull condition for the component based on whether it is obscured.
 * @param isUncullableLEdge - Calculated uncull condition for the component based on whether it is a corner.
 * @returns Whether the component should be culled.
 */
function shouldCull(
  isCullableFace: boolean,
  isCullableObscured: boolean,
  isUncullableLEdge: boolean = false
): boolean {
  // if a component is obscured, it must be culled regardless of other conditions
  // otherwise unculling has higher priority than culling as it is an override
  return (isCullableFace && !isUncullableLEdge) || isCullableObscured
}

/**
 * Represents an isometric cube.
 * Contains culling properties that facilitates multi-cube rendering,
 * they should be precomputed by the owner of multiple cubes, like an isometric structure.
 */
export function Cube({ cuboidIndex, x, y, z, spacing, cullFaces, uncullLEdges, cullObscured }: CubeProps) {
  const highlightKind = useStore((state) => state.highlightKind)
  const highlightedTarget = useDrawingStore((state) => state.highlightedTarget)

  /* Map of face axis to what kind of highlighting is applied to that face. */
  const highlightedCubeFaceMap = Object.fromEntries(['x', 'y', 'z'].map((axis) => {
    return [axis, isCubeFaceHighlighted(highlightKind, highlightedTarget, { cuboidIndex, x, y, z }, axis as PositiveAxis)]
  })) as Record<PositiveAxis, HighlightKind>

  // center of cube rendering
  // x and -z increments q
  // z and -y increments r
  // y and -x increments s
  const hexOrigin = new Hex(x - z, z - y, y - x)

  // adding origin by a unit hex of the given direction will give a hex of a vertex of this cube
  function originPlusDirection(direction: number): Hex {
    return HexUtils.add(hexOrigin, HexUtils.direction(direction))
  }

  // triangular faces that have a vertex at the center and two vertices at adjacent outline vertices
  // triangular since obscuring may only cover part of a quadrilateral face
  const faces = []
  for (let startDirection = 0; startDirection < 6; startDirection++) {
    const endDirection = (startDirection + 1) % 6

    // if the start equals to the obscured direction, this triangle is in the anticlockwise half of the obscuring rhombus
    // if the end equals to the obscured direction, this triangle is in the clockwise half of the obscuring rhombus
    function shouldCullObscured(obscuredDirection: Direction): boolean {
      return startDirection === obscuredDirection || endDirection === obscuredDirection
    }

    if (cullObscured.some(shouldCullObscured)) continue

    faces.push(
      <TriangularFace
        spacing={spacing}
        cubeLocation={{ cuboidIndex, x, y, z }}
        startDirection={startDirection as Direction}
        highlightedCubeFaceMap={highlightedCubeFaceMap}
      />
    )
  }

  // three edges that originate from the center of the cube
  // overlapping render and coupling between face culling and obscured culling can be reduced by redefining
  // L-edge unculling to respect obscured culling
  const prongs = []
  for (let direction = 1; direction < 6; direction += 2) {
    // culling for adjacent faces
    // since the faces that will cause culling is on a positive axis, they are even in obscured direction
    // obscured culling will skip even direction culling, but culling cannot be skipped if the other cube is adjacent
    function shouldCullFace(axis: Axis): boolean {
      const { isPositive, absAxis } = axisIntoParts(axis)
      return isPositive && cullFacePredicateMap[absAxis](direction)
    }

    // only matches odd obscured directions, this prong is crossing the center of the rhombus
    // does not match even obscured directions as that would cull L-edges again
    // so there is a overlapping render if obscured direction is even and the other cube is not directly adjacent
    function shouldCullObscured(obscuredDirection: Direction): boolean {
      return obscuredDirection === direction
    }

    // special unculling if a cube is at a corner of an L-shape
    // L-edge should be unculled even if none of the face of the cube is visible
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

  // six edges that surrounds the cube
  const outlines = []
  for (let startDirection = 0; startDirection < 6; startDirection++) {
    const endDirection = (startDirection + 1) % 6

    // culling for adjacent faces
    // if the axis is positive, this culling repeats the work of obscured culling
    // otherwise this culls if a cube is joined from the back
    function shouldCullFace(axis: Axis): boolean {
      const { isPositive, absAxis } = axisIntoParts(axis)
      const cullingPredicate = cullFacePredicateMap[absAxis]

      if (isPositive) {
        return cullingPredicate(startDirection) && cullingPredicate(endDirection)
      } else {
        return !cullingPredicate(startDirection) && !cullingPredicate(endDirection)
      }
    }

    // if the start equals to the obscured direction, this edge is in the anticlockwise half of the obscuring rhombus
    // if the end equals to the obscured direction, this edge is in the clockwise half of the obscuring rhombus
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
