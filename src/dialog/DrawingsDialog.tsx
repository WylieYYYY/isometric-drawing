import type { DrawingDefinition } from './../drawing/DrawingStore.tsx'
import { useEffect, useRef } from 'react'
import { DrawingProvider } from './../drawing/DrawingStore.tsx'
import { IsometricViewport } from './../drawing/isometric/IsometricViewport.tsx'
import { defaultDrawingDefinition, useStore } from './../Store.tsx'

type DrawingsDialogProps = {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  setInitialDefinition: (initialDefinition: DrawingDefinition) => void
}

export function DrawingsDialog({ isOpen, setIsOpen, setInitialDefinition }: DrawingsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement|null>(null)

  const drawings = useStore((state) => state.drawings)

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
          ...drawings.map((drawing) => (
            <DrawingProvider initialDefinition={{ isInteractive: false, ...drawing }}>
              <div
                onClick={() => switchToDrawing(drawing)}
                style={{ width: 'calc(16rem + 4px)', marginRight: '0.5rem', padding: '0.5rem', border: '2px solid black', cursor: 'pointer' }}
              >
                <span>{drawing.name}</span>
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
