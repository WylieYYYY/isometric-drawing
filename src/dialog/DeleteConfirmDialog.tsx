import type { DrawingDefinition } from './../drawing/DrawingStore.tsx'
import { Dialog } from './Dialog.tsx'
import { useDrawingStore } from './../drawing/DrawingStoreHook.ts'
import { defaultDrawingDefinition, useStore } from './../Store.tsx'

type DeleteConfirmDialogProps = {
  setInitialDefinition: (initialDefinition: DrawingDefinition) => void
  definitionIndex: number|null
  setDefinitionIndex: (definitionIndex: number|null) => void
}

export function DeleteConfirmDialog({
  setInitialDefinition, definitionIndex, setDefinitionIndex
}: DeleteConfirmDialogProps) {
  const deleteDefinition = useStore((state) => state.deleteDefinition)

  const currentDefinitionIndex = useDrawingStore((state) => state.definitionIndex)

  function onClickDeleteCallback() {
    deleteDefinition(definitionIndex!)
    // the current drawing is the one being deleted, switch to the default drawing
    if (definitionIndex === currentDefinitionIndex) {
      setInitialDefinition(defaultDrawingDefinition())
    }
    setDefinitionIndex(null)
  }

  return (
    <Dialog isOpen={definitionIndex !== null} close={() => setDefinitionIndex(null)} title='Confirm Deletion'>
      <section className='modal-body' style={{ minHeight: 'auto' }}>
        <p>
          Are you sure that you want to delete the drawing?<br />
          It will be deleted forever if it is not exported into a local CSV file.
        </p>
        <footer className='modal-footer'>
          <button className='btn btn-secondary' onClick={() => setDefinitionIndex(null)}>Cancel</button>
          <button className='btn btn-danger' onClick={onClickDeleteCallback}>Delete</button>
        </footer>
      </section>
    </Dialog>
  )
}
