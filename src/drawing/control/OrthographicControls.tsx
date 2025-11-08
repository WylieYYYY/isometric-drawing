import { useShallow } from 'zustand/react/shallow'
import { useDrawingStore } from './../DrawingStoreHook.ts'

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
      <label>
        <input
          type='checkbox'
          checked={shouldSplitOrthographicViewsAsThree}
          onChange={(event) => setShouldSplitOrthographicViewsAsThree(event.target.checked)}
        />
        Split Export
      </label>
      <label>
        <input
          type='checkbox'
          checked={shouldShowOrthographicViewsGrid && !shouldSplitOrthographicViewsAsThree}
          onChange={(event) => setShouldShowOrthographicViewsGrid(event.target.checked)}
          disabled={shouldSplitOrthographicViewsAsThree}
        />
        Show Grid
      </label>
      <label>
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
