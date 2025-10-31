import { useShallow } from 'zustand/react/shallow'
import { useDrawingStore } from './../DrawingStoreHook.ts'

export function OrthographicControls() {
  const [
    shouldSplitOrthographicViewsAsThree,
    setShouldSplitOrthographicViewsAsThree
  ] = useDrawingStore(useShallow((state) => [
    state.shouldSplitOrthographicViewsAsThree,
    state.setShouldSplitOrthographicViewsAsThree
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
    </>
  )
}
