import { useShallow } from 'zustand/react/shallow'
import { OrthographicView } from './OrthographicView.tsx'
import { cubeLocationFromCuboidValues } from './../../Store.tsx'
import { useDrawingStore } from './../DrawingStoreHook.ts'
import { rotate, updateMinMax } from './../../util.ts'

type OrthographicViewsProps = {
  isSplittable?: boolean
}

/**
 * Combined layout of orthographic views.
 * This places the views according to the specification and wrap them in a single SVG.
 */
export function OrthographicViews({ isSplittable }: OrthographicViewsProps) {
  const [
    shouldSplitOrthographicViewsAsThree,
    cuboidValues,
    rotation
  ] = useDrawingStore(useShallow((state) => [
    state.shouldSplitOrthographicViewsAsThree,
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

  // splitting does not layout the views so it is only used for exporting
  return (isSplittable ?? false) && shouldSplitOrthographicViewsAsThree ? (
    <>
      <svg viewBox={`-1 -1 ${size.x + 2} ${size.z + 2}`} data-export-name='orthotop'>
        <OrthographicView from='y' coordinates={coordinates} offsetX={0} offsetY={0} />
      </svg>
      <svg viewBox={`-1 -1 ${size.x + 2} ${size.y + 2}`} data-export-name='orthofront'>
        <OrthographicView from='z' coordinates={coordinates} offsetX={0} offsetY={0} />
      </svg>
      <svg viewBox={`-1 -1 ${size.z + 2} ${size.y + 2}`} data-export-name='orthoside'>
        <OrthographicView from='x' coordinates={coordinates} offsetX={0} offsetY={0} />
      </svg>
    </>
  ) : (
    // padding of 2 between views and margins of 1 (sum of 2 for both sides) to the edges
    <svg
      width='100%'
      height='100%'
      viewBox={`-1 -1 ${size.x + size.z + 2 + 2} ${size.z + size.y + 2 + 2}`}
      data-export-name='ortho'
    >
      <OrthographicView from='y' coordinates={coordinates} offsetX={0} offsetY={0} />
      <OrthographicView from='z' coordinates={coordinates} offsetX={0} offsetY={size.z + 2} />
      <OrthographicView from='x' coordinates={coordinates} offsetX={size.x + 2} offsetY={size.z + 2} />
    </svg>
  )
}
