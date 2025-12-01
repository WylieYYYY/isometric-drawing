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

  function save(drawingIndex: number, newName?: string) {
    setDrawingIndex(drawingIndex)
    setDrawing(drawingIndex, { drawingIndex, name: newName ?? name, cuboidValues, rotation })
  }

  function saveAs() {
    const name = prompt('Please enter the name of the drawing:', 'Untitled Drawing')
    if (name === null) return
    const drawingIndex = newDrawing()
    setName(name)
    save(drawingIndex, name)
  }

  return (
    <>
      <button
        onClick={() => save(existingDrawingIndex!)}
        disabled={!hasDefinitionChanged || existingDrawingIndex === null}
      >
        Save
      </button>
      <button onClick={saveAs}>Save As</button>
      <span>{hasDefinitionChanged ? '(Unsaved)' : '(Saved)'}</span>
      <div>Current Drawing: <code>{name}</code></div>
    </>
  )
}
