import type { DrawingDefinition } from './DrawingStore.tsx'
import { useShallow } from 'zustand/react/shallow'
import { useDrawingStore } from './DrawingStoreHook.ts'
import { defaultDrawingDefinition, useStore } from './../Store.tsx'

type StoreDrawingControlsProps = {
  setInitialDefinition: (initialDefinition: DrawingDefinition) => void
  setIsDrawingsDialogOpen: (isDrawingsDialogOpen: boolean) => void
}

/** The "New", "Open / Manage", "Save", "Save As" buttons, as well as the save indicator and file name display. */
export function StoreDrawingControls({ setInitialDefinition, setIsDrawingsDialogOpen }: StoreDrawingControlsProps) {
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
    // this is required even if the index did not change
    // as it remove the unsaved change flag `hasDefinitionChanged`
    setDrawingIndex(drawingIndex)
    setDrawing(drawingIndex, {
      definitionKind: 'drawing',
      definition: {
        drawingIndex,
        name: newName ?? name,
        cuboidValues,
        rotation
      }
    })
  }

  // only need to allocate new index and set a name for the new drawing, then save as usual
  function saveAs() {
    const name = prompt('Please enter the name of the drawing:', 'Untitled Drawing')
    if (name === null) return
    const drawingIndex = newDrawing('drawing')
    setName(name)
    save(drawingIndex, name)
  }

  return (
    <>
      <button onClick={() => setInitialDefinition(defaultDrawingDefinition())}>New</button>
      <button onClick={() => setIsDrawingsDialogOpen(true)}>Open / Manage</button>
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
