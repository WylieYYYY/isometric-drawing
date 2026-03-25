import { useShallow } from 'zustand/react/shallow'
import { useDrawingStore } from './../DrawingStoreHook.ts'

/**
 * Checkboxes to toggle orthographic preference.
 * If the orthographic views should be split,
 * grid is hidden and structure must be shown
 * since the alternatives are not implemented.
 *
 * Screenshot:
 *
 * ![screenshot](screenshots/OrthographicControls.png)
 */
export function OrthographicControls() {
  const [
    shouldSplitOrthographicViewsAsThree,
    setShouldSplitOrthographicViewsAsThree,
    shouldShowOrthographicViewsGrid,
    setShouldShowOrthographicViewsGrid,
    shouldShowOrthographicStructure,
    setShouldShowOrthographicStructure
  ] = useDrawingStore(useShallow((state) => [
    state.shouldSplitOrthographicViewsAsThree,
    state.setShouldSplitOrthographicViewsAsThree,
    state.shouldShowOrthographicViewsGrid,
    state.setShouldShowOrthographicViewsGrid,
    state.shouldShowOrthographicStructure,
    state.setShouldShowOrthographicStructure
  ]))

  return (
    <>
      <label style={{ display: 'block' }}>
        <input
          type='checkbox'
          checked={shouldSplitOrthographicViewsAsThree}
          onChange={(event) => setShouldSplitOrthographicViewsAsThree(event.target.checked)}
        />
        Split Export
      </label>
      <label style={{ display: 'block' }}>
        <input
          type='checkbox'
          checked={shouldShowOrthographicViewsGrid && !shouldSplitOrthographicViewsAsThree}
          onChange={(event) => setShouldShowOrthographicViewsGrid(event.target.checked)}
          disabled={shouldSplitOrthographicViewsAsThree}
        />
        Show Grid
      </label>
      <label style={{ display: 'block' }}>
        <input
          type='checkbox'
          checked={shouldShowOrthographicStructure || shouldSplitOrthographicViewsAsThree}
          onChange={(event) => setShouldShowOrthographicStructure(event.target.checked)}
          disabled={shouldSplitOrthographicViewsAsThree}
        />
        Show Structure
      </label>
    </>
  )
}
