import { useShallow } from 'zustand/react/shallow'
import { useDrawingStore } from './../DrawingStoreHook.ts'

export function IsometricControls() {
  const [
    shouldCropIsometricViewport,
    setShouldCropIsometricViewport,
    shouldShowGrid,
    setShouldShowGrid,
    shouldShowAxisArrows,
    setShouldShowAxisArrows
  ] = useDrawingStore(useShallow((state) => [
    state.shouldCropIsometricViewport,
    state.setShouldCropIsometricViewport,
    state.shouldShowGrid,
    state.setShouldShowGrid,
    state.shouldShowAxisArrows,
    state.setShouldShowAxisArrows
  ]))

  return (
    <>
      <label>
        <input
          type='checkbox'
          checked={shouldCropIsometricViewport}
          onChange={(event) => setShouldCropIsometricViewport(event.target.checked)}
        />
        Crop Export
      </label>
      <label>
        <input
          type='checkbox'
          checked={shouldShowGrid}
          onChange={(event) => setShouldShowGrid(event.target.checked)}
        />
        Show Grid
      </label>
      <label>
        <input
          type='checkbox'
          checked={shouldShowAxisArrows}
          onChange={(event) => setShouldShowAxisArrows(event.target.checked)}
        />
        Show Axes
      </label>
    </>
  )
}
