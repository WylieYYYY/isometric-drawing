import { useShallow } from 'zustand/react/shallow'
import { useDrawingStore } from './DrawingStoreHook.ts'
import { useStore } from './../Store.tsx'

export function StoreDrawingControls() {
  const [
    newDrawing,
    setDrawing
  ] = useStore(useShallow((state) => [
    state.newDrawing,
    state.setDrawing
  ]))

  const [
    hasDefinitionChanged,
    existingDrawingIndex,
    setDrawingIndex,
    name,
    setName,
    cuboidValues,
    rotation
  ] = useDrawingStore(useShallow((state) => [
    state.hasDefinitionChanged,
    state.drawingIndex,
    state.setDrawingIndex,
    state.name,
    state.setName,
    state.cuboidValues,
    state.rotation
  ]))

  function save() {
    const drawingIndex = existingDrawingIndex ?? newDrawing()
    setDrawingIndex(drawingIndex)
    setDrawing(drawingIndex, { drawingIndex, name, cuboidValues, rotation })
  }

  return (
    <>
      <label>
        Name:
        <input value={name} maxLength={20} placeholder='Untitled Drawing' onChange={(event) => setName(event.target.value)} />
      </label>
      <button onClick={save}>Save</button>
      <span>{hasDefinitionChanged ? '(Unsaved)' : `(Saved)`}</span>
    </>
  )
}
