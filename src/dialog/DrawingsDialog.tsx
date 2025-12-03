import type { DrawingDefinition } from './../drawing/DrawingStore.tsx'
import { Quaternion } from 'quaternion'
import { useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { DrawingProvider } from './../drawing/DrawingStore.tsx'
import { useDrawingStore } from './../drawing/DrawingStoreHook.ts'
import { IsometricViewport } from './../drawing/isometric/IsometricViewport.tsx'
import { OrthographicEditor } from './OrthographicEditor.tsx'
import { defaultDrawingDefinition, useStore } from './../Store.tsx'

type DrawingsDialogProps = {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  setInitialDefinition: (initialDefinition: DrawingDefinition) => void
  setOrthographicEditorDrawingIndex: (orthographicEditorDrawingIndex: number|null) => void
}

export function DrawingsDialog({ isOpen, setIsOpen, setInitialDefinition, setOrthographicEditorDrawingIndex }: DrawingsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement|null>(null)

  const [
    drawings,
    deleteDrawing
  ] = useStore(useShallow((state) => [
    state.drawings,
    state.deleteDrawing
  ]))

  const drawingIndex = useDrawingStore((state) => state.drawingIndex)

  useEffect(() => {
    if (!isOpen) return
    const dialog = dialogRef.current!
    dialog.showModal()
    return () => dialog.close()
  }, [isOpen])

  return (
    <dialog ref={dialogRef}>
      <header style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Drawings</h1>
        <button onClick={() => setIsOpen(false)} style={{ float: 'right' }}>Close</button>
      </header>
      <section style={{ display: 'flex', flexDirection: 'row', overflowX: 'scroll' }}>
        {
          ...drawings.filter((drawing) => drawing !== null).map(({ definitionKind, definition }) => {
            let switchToDefinition, preview
            switch (definitionKind) {
              case 'drawing': {
                const { rotation, ...rest } = definition
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
                switchToDefinition = () => setOrthographicEditorDrawingIndex(definition.drawingIndex)
                preview = <OrthographicEditor map={definition.map} />
                break
            }

            return (
              <div
                onClick={
                  () => {
                    switchToDefinition()
                    setIsOpen(false)
                  }
                }
                style={{ width: 'calc(16rem + 4px)', marginRight: '0.5rem', padding: '0.5rem', border: '2px solid black', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{definition.name}</span>
                  <button
                    onClick={
                      (event) => {
                        deleteDrawing(definition.drawingIndex!)
                        if (definition.drawingIndex === drawingIndex) setInitialDefinition(defaultDrawingDefinition())
                        event.stopPropagation()
                      }
                    }>
                      Delete
                    </button>
                </div>
                <div style={{ width: '16rem', height: '8rem', border: '2px solid black' }}>
                  {preview}
                </div>
              </div>
            )
          })
        }
      </section>
      <footer>
        <button
          onClick={
            () => {
              setInitialDefinition(defaultDrawingDefinition())
              setIsOpen(false)
            }
          }
          style={{ float: 'right' }}
        >
          Create New Drawing
        </button>
      </footer>
    </dialog>
  )
}
