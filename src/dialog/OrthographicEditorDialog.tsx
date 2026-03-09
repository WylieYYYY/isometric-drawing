import type { LineType } from './OrthographicEditorLine.tsx'
import type { OrthographicDrawingDefinition } from './../Store.tsx'
import { useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Dialog } from './Dialog.tsx'
import { ExportButton } from './../io/ExportButton.tsx'
import { ExportContainer } from './../io/ExportContainer.tsx'
import { OrthographicEditor } from './OrthographicEditor.tsx'
import { useStore } from './../Store.tsx'

type OrthographicEditorDialogProps = {
  definitionIndex: number|null
  setDefinitionIndex: (index: number|null) => void
}

/**
 * Editor dialog that allows orthographic drawings to be produced by drawing lines by hand.
 * Unlike other dialogs, this dialog is unrendered from tree when closed.
 * The given `definitionIndex` must point to a valid orthographic drawing definition,
 * or be null which unrenders the dialog.
 */
export function OrthographicEditorDialog({ definitionIndex, setDefinitionIndex }: OrthographicEditorDialogProps) {
  const dialogRef = useRef<HTMLDialogElement|null>(null)

  const [
    definition,
    setDefinition
  ] = useStore(useShallow((state) => [
    state.definitions,
    state.setDefinition
  ]))

  // don't render at all if there is no valid index
  // since there is no way to provide valid `map` and `setMap`
  if (definitionIndex === null) return null

  // relies on the pre-conditions mentioned in the component description
  const map = (definition[definitionIndex]!.definition as OrthographicDrawingDefinition).map
  // reconstructs the definition with the map changed
  const setMap = (map: Array<Array<LineType>>) => {
    const definitionClone = structuredClone(definition[definitionIndex]!);
    (definitionClone.definition as OrthographicDrawingDefinition).map = map
    setDefinition(definitionIndex!, definitionClone)
  }

  return (
    <Dialog
      ref={dialogRef}
      isOpen={setDefinitionIndex !== null}
      close={() => setDefinitionIndex(null)}
      title='Orthographic Editor'
    >
      <section className='modal-body'>
        <OrthographicEditor map={map} setMap={setMap} />
        <ExportContainer display='none'>
          <OrthographicEditor map={map} />
        </ExportContainer>
      </section>
      <footer className='modal-footer' style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button
          onClick={() => setMap(map.map((column) => Array(column.length).fill(0)))}
          className='btn btn-warning'
        >
          Clear
        </button>
        <div>
          <ExportButton asPNG={true} containerParentRef={dialogRef} />
          <ExportButton asPNG={false} containerParentRef={dialogRef} />
        </div>
        <button
          onClick={() => setDefinitionIndex(null)}
          className='btn btn-primary'
        >
          Save
        </button>
      </footer>
    </Dialog>
  )
}
