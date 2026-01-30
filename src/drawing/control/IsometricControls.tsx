import { useShallow } from 'zustand/react/shallow'
import { useDrawingStore } from './../DrawingStoreHook.ts'

/** Checkboxes to toggle isometric views preference. */
export function IsometricControls() {
  const [
    shouldCropIsometricViewport,
    setShouldCropIsometricViewport,
    shouldShowIsometricGrid,
    setshouldShowIsometricGrid,
    shouldShowAxisArrows,
    setShouldShowAxisArrows,
    shouldShowIsometricStructure,
    setshouldShowIsometricStructure
  ] = useDrawingStore(useShallow((state) => [
    state.shouldCropIsometricViewport,
    state.setShouldCropIsometricViewport,
    state.shouldShowIsometricGrid,
    state.setshouldShowIsometricGrid,
    state.shouldShowAxisArrows,
    state.setShouldShowAxisArrows,
    state.shouldShowIsometricStructure,
    state.setshouldShowIsometricStructure
  ]))

  return (
    <>
      <label style={{ display: 'block' }}>
        <input
          type='checkbox'
          checked={shouldCropIsometricViewport}
          onChange={(event) => setShouldCropIsometricViewport(event.target.checked)}
        />
        Crop Export
      </label>
      <label style={{ display: 'block' }}>
        <input
          type='checkbox'
          checked={shouldShowIsometricGrid}
          onChange={(event) => setshouldShowIsometricGrid(event.target.checked)}
        />
        Show Grid
      </label>
      <label style={{ display: 'block' }}>
        <input
          type='checkbox'
          checked={shouldShowAxisArrows}
          onChange={(event) => setShouldShowAxisArrows(event.target.checked)}
        />
        Show Axes
      </label>
      <label style={{ display: 'block' }}>
        <input
          type='checkbox'
          checked={shouldShowIsometricStructure}
          onChange={(event) => setshouldShowIsometricStructure(event.target.checked)}
        />
        Show Structure
      </label>
    </>
  )
}
