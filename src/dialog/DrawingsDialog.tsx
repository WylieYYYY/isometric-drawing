import type { MouseEvent as ReactMouseEvent } from 'react'
import type { DrawingDefinition } from './../drawing/DrawingStore.tsx'
import type { TaggedDefinition } from './../Store.tsx'
import { Quaternion } from 'quaternion'
import { Dialog } from './Dialog.tsx'
import { DrawingProvider } from './../drawing/DrawingStore.tsx'
import { useDrawingStore } from './../drawing/DrawingStoreHook.ts'
import { IsometricViewport } from './../drawing/isometric/IsometricViewport.tsx'
import { OrthographicEditor } from './OrthographicEditor.tsx'
import { defaultDrawingDefinition, useStore } from './../Store.tsx'

type DrawingsDialogProps = {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  setInitialDefinition: (initialDefinition: DrawingDefinition) => void
  setOrthographicEditorDefinitionIndex: (orthographicEditorDefinitionIndex: number|null) => void
}

type DrawingCardProps = {
  setIsOpen: (isOpen: boolean) => void
  setInitialDefinition: (initialDefinition: DrawingDefinition) => void
  setOrthographicEditorDefinitionIndex: (orthographicEditorDefinitionIndex: number|null) => void
  definition: TaggedDefinition
}

/** Card in drawings dialog that display a preview which switches to the definition when clicked. */
function DrawingCard({ setIsOpen, setInitialDefinition, setOrthographicEditorDefinitionIndex, definition }: DrawingCardProps) {
  const deleteDefinition = useStore((state) => state.deleteDefinition)
  const definitionIndex = useDrawingStore((state) => state.definitionIndex)

  let switchToDefinition: () => void, preview
  switch (definition.definitionKind) {
    case 'drawing': {
      const { rotation, ...rest } = definition.definition
      const drawingDefinition = { rotation: new Quaternion(rotation), ...rest }
      switchToDefinition = () => setInitialDefinition(drawingDefinition)
      preview = (
        <DrawingProvider initialDefinition={{ isInteractive: false, ...drawingDefinition }}>
          <IsometricViewport canHaveUndefinedSize={false} size={{ width: '100%', height: '100%' }} />
        </DrawingProvider>
      )
      break
    }
    case 'orthographic':
      switchToDefinition = () => setOrthographicEditorDefinitionIndex(definition.definition.definitionIndex)
      preview = <OrthographicEditor map={definition.definition.map} />
      break
  }

  function onClickCallback() {
    switchToDefinition()
    setIsOpen(false)
  }

  function onClickDeleteCallback(event: ReactMouseEvent<HTMLButtonElement, MouseEvent>) {
    deleteDefinition(definition.definition.definitionIndex!)
    // the current drawing is the one being deleted, switch to the default drawing
    if (definition.definition.definitionIndex === definitionIndex) {
      setInitialDefinition(defaultDrawingDefinition())
    }
    event.stopPropagation()
  }

  return (
    <div className='card' onClick={onClickCallback}>
      <div className='card-header' style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h5 className='card-title'>{definition.definition.name}</h5>
        <button onClick={onClickDeleteCallback} className='btn btn-danger'>Delete</button>
      </div>
      <div className='preview'>{preview}</div>
    </div>
  )
}

/**
 * Dialog for management of definitions.
 * Dialogs exist in tree at all time, only the visibility is toggled.
 */
export function DrawingsDialog({ isOpen, setIsOpen, setInitialDefinition, setOrthographicEditorDefinitionIndex }: DrawingsDialogProps) {
  const definitions = useStore((state) => state.definitions)

  const cards = []
  for (const definition of definitions.filter((definition) => definition !== null)) {
    cards.push(
      <DrawingCard
        key={definition.definition.definitionIndex}
        setIsOpen={setIsOpen}
        setInitialDefinition={setInitialDefinition}
        setOrthographicEditorDefinitionIndex={setOrthographicEditorDefinitionIndex}
        definition={definition}
      />
    )
  }

  return (
    <Dialog isOpen={isOpen} close={() => setIsOpen(false)} title='Drawings'>
      <section className='modal-body'>
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '0.5rem', overflow: 'scroll' }}>
          {cards.length > 0 ? cards : 'Get started by saving a drawing using "Save As"!'}
        </div>
      </section>
    </Dialog>
  )
}
