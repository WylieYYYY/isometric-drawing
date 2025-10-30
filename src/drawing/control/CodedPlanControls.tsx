import { useShallow } from 'zustand/react/shallow'
import { useDrawingStore } from './../DrawingStoreHook.ts'

export function CodedPlanControls() {
  const [
    shouldShowCodedPlanNumbers,
    setShouldShowCodedPlanNumbers
  ] = useDrawingStore(useShallow((state) => [
    state.shouldShowCodedPlanNumbers,
    state.setShouldShowCodedPlanNumbers
  ]))

  return (
    <label>
      <input
        type='checkbox'
        checked={shouldShowCodedPlanNumbers}
        onChange={(event) => setShouldShowCodedPlanNumbers(event.target.checked)}
      />
      Show Numbers
    </label>
  )
}
