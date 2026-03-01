import type { LineType } from './OrthographicEditorLine.tsx'
import type { OrthographicDrawingDefinition } from './../Store.tsx'
import { useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
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

  useEffect(() => {
    if (definitionIndex === null) return
    const dialog = dialogRef.current!
    dialog.showModal()
    return () => dialog.close()
  }, [definitionIndex])

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
    <dialog ref={dialogRef}>
      <header style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Orthographic Editor</h1>
        <button onClick={() => setDefinitionIndex(null)} style={{ float: 'right' }}>Close</button>
      </header>
      <section style={{ height: '20rem' }}>
        <OrthographicEditor map={map} setMap={setMap} />
        <ExportContainer display='none'>
          <OrthographicEditor map={map} />
        </ExportContainer>
      </section>
      <footer>
        <button
          onClick={async () => setMap(map.map((column) => column.fill(0)))}
          style={{ float: 'left' }}
        >
          Clear
        </button>
        <div style={{ float: 'right' }}>
          <ExportButton asPNG={true} containerParentRef={dialogRef} />
          <ExportButton asPNG={false} containerParentRef={dialogRef} />
        </div>
      </footer>
    </dialog>
  )
}
