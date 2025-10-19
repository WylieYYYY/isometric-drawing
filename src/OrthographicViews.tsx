import { useShallow } from 'zustand/react/shallow'
import { OrthographicView } from './OrthographicView.tsx'
import { cubeLocationFromCuboidValues, useStore } from './Store.tsx'
import { rotate, updateMinMax } from './util.ts'

/**
 * Combined layout of orthographic views.
 * This places the views according to the specification and wrap them in a single SVG.
 */
export function OrthographicViews() {
  const [
    cuboidValues,
    rotation
  ] = useStore(useShallow((state) => [
    state.cuboidValues,
    state.rotation
  ]))

  let coordinates = cubeLocationFromCuboidValues(cuboidValues).map(({ cuboidIndex, ...rest }) => rest)
  coordinates = rotate(coordinates, rotation)

  // limits for calculating size which is used for spacing out the views
  const minMaxCoordinates = { x: { min: Infinity, max: -Infinity }, y: { min: Infinity, max: -Infinity }, z: { min: Infinity, max: -Infinity } }
  for (const { ...rest } of coordinates) updateMinMax(minMaxCoordinates, rest)

  // size is difference in coordinates add one
  const size = {
    x: minMaxCoordinates.x.max - minMaxCoordinates.x.min + 1,
    y: minMaxCoordinates.y.max - minMaxCoordinates.y.min + 1,
    z: minMaxCoordinates.z.max - minMaxCoordinates.z.min + 1
  }

  // padding of 1 between views and margins of 1 (sum of 2 for both sides) to the edges
  return (
    <svg width='100%' height='100%' viewBox={`-1 -1 ${size.x + size.z + 1 + 2} ${size.z + size.y + 1 + 2}`}>
      <OrthographicView from='y' coordinates={coordinates} offsetX={0} offsetY={0} />
      <OrthographicView from='z' coordinates={coordinates} offsetX={0} offsetY={size.z + 1} />
      <OrthographicView from='x' coordinates={coordinates} offsetX={size.x + 1} offsetY={size.z + 1} />
    </svg>
  )
}
