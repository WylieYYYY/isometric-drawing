import type { DrawingDefinition } from './../drawing/DrawingStore.tsx'
import { Quaternion } from 'quaternion'
import { useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { DrawingProvider } from './../drawing/DrawingStore.tsx'
import { useDrawingStore } from './../drawing/DrawingStoreHook.ts'
import { IsometricViewport } from './../drawing/isometric/IsometricViewport.tsx'
import { defaultDrawingDefinition, useStore } from './../Store.tsx'

type DrawingsDialogProps = {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  setInitialDefinition: (initialDefinition: DrawingDefinition) => void
}

export function DrawingsDialog({ isOpen, setIsOpen, setInitialDefinition }: DrawingsDialogProps) {
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

  function switchToDrawing(drawingDefinition: DrawingDefinition) {
    setInitialDefinition(drawingDefinition)
    setIsOpen(false)
  }

  return (
    <dialog ref={dialogRef}>
      <header style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Drawings</h1>
        <button onClick={() => setIsOpen(false)} style={{ float: 'right' }}>Close</button>
      </header>
      <section style={{ display: 'flex', flexDirection: 'row', overflowX: 'scroll' }}>
        {
          ...drawings.filter((drawing) => drawing !== null).map(({ rotation, ...rest }) => (
            <DrawingProvider initialDefinition={{ isInteractive: false, rotation: new Quaternion(rotation), ...rest }}>
              <div
                onClick={() => switchToDrawing({ rotation: new Quaternion(rotation), ...rest })}
                style={{ width: 'calc(16rem + 4px)', marginRight: '0.5rem', padding: '0.5rem', border: '2px solid black', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{rest.name}</span>
                  <button
                    onClick={
                      (event) => {
                        deleteDrawing(rest.drawingIndex!)
                        if (rest.drawingIndex === drawingIndex) setInitialDefinition(defaultDrawingDefinition())
                        event.stopPropagation()
                      }
                    }>
                      Delete
                    </button>
                </div>
                <div style={{ width: '16rem', height: '8rem', border: '2px solid black' }}>
                  <IsometricViewport canHaveUndefinedSize={false} size={{ width: '100%', height: '100%' }} />
                </div>
              </div>
            </DrawingProvider>
          ))
        }
      </section>
      <footer>
        <button onClick={() => switchToDrawing(defaultDrawingDefinition())} style={{ float: 'right' }}>Create New Drawing</button>
      </footer>
    </dialog>
  )
}
