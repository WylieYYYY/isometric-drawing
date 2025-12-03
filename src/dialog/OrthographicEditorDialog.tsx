import type { LineType } from './OrthographicEditorLine.tsx'
import type { OrthographicDrawingDefinition } from './../Store.tsx'
import { useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { createExportBlob, openDownloadPopup, wrapWithExportContainer } from './../export.tsx'
import { OrthographicEditor } from './OrthographicEditor.tsx'
import { useStore } from './../Store.tsx'

type OrthographicEditorDialogProps = {
  drawingIndex: number|null
  setDrawingIndex: (index: number|null) => void
  setDownloadUrl: (downloadUrl: string) => void
}

export function OrthographicEditorDialog({ drawingIndex, setDrawingIndex, setDownloadUrl }: OrthographicEditorDialogProps) {
  const dialogRef = useRef<HTMLDialogElement|null>(null)

  const [
    drawings,
    setDrawing
  ] = useStore(useShallow((state) => [
    state.drawings,
    state.setDrawing
  ]))

  useEffect(() => {
    if (drawingIndex === null) return
    const dialog = dialogRef.current!
    dialog.showModal()
    return () => dialog.close()
  }, [drawingIndex])

  if (drawingIndex === null) return null

  const map = (drawings[drawingIndex]!.definition as OrthographicDrawingDefinition).map
  const setMap = (map: Array<Array<LineType>>) => {
    const drawing = structuredClone(drawings[drawingIndex]!);
    (drawing.definition as OrthographicDrawingDefinition).map = map
    setDrawing(drawingIndex!, drawing)
  }

  return (
    <dialog ref={dialogRef}>
      <header style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Orthographic Editor</h1>
        <button onClick={() => setDrawingIndex(null)} style={{ float: 'right' }}>Close</button>
      </header>
      <section style={{ height: '20rem' }}>
        <OrthographicEditor map={map} setMap={setMap} />
        {wrapWithExportContainer(<OrthographicEditor map={map} />, 'none')}
      </section>
      <footer>
        <button
          onClick={async () => setMap(map.map((column) => column.fill(0)))}
          style={{ float: 'left' }}
        >
          Clear
        </button>
        <button
          onClick={async () => openDownloadPopup(await createExportBlob(`.export-container svg`, false, dialogRef.current!), setDownloadUrl)}
          style={{ float: 'right' }}
        >
          Export SVG
        </button>
        <button
          onClick={async () => openDownloadPopup(await createExportBlob(`.export-container svg`, true, dialogRef.current!), setDownloadUrl)}
          style={{ float: 'right' }}
        >
          Export PNG
        </button>
      </footer>
    </dialog>
  )
}
