import type { LineType } from './OrthographicEditorLine.tsx'
import { useEffect, useRef, useState } from 'react'
import { createExportBlob, openDownloadPopup, wrapWithExportContainer } from './../export.tsx'
import { OrthographicEditorLine } from './OrthographicEditorLine.tsx'

type OrthographicEditorDialogProps = {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  setDownloadUrl: (downloadUrl: string) => void
}

export function OrthographicEditorDialog({ isOpen, setIsOpen, setDownloadUrl }: OrthographicEditorDialogProps) {
  const dialogRef = useRef<HTMLDialogElement|null>(null)

  const [map, setMap] = useState<Array<Array<LineType>>>([
    [0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0]
  ])

  useEffect(() => {
    if (!isOpen) return
    const dialog = dialogRef.current!
    dialog.showModal()
    return () => dialog.close()
  }, [isOpen])

  const background = [], lines = []
  for (const [columnIndex, row] of Object.entries(map)) {
    for (const [rowIndex, lineType] of Object.entries(row)) {
      const c = parseInt(columnIndex)
      const r = parseInt(rowIndex)

      if (c % 2 === 0 && c !== map.length - 1) {
        background.push(
          <rect
            x={Math.floor(c / 2)} y={r}
            width={1} height={1}
            fill='transparent'
            stroke='lightgray'
            strokeWidth={0.1}
          />
        )
      }

      lines.push(
        <OrthographicEditorLine
          lineType={lineType}
          setLineType={
            (lineType) => {
              const newMap = [...map]
              newMap[c][r] = lineType
              setMap(newMap)
            }
          }
          start={{ x: Math.floor(c / 2), y: r }}
          isHorizontal={c % 2 === 1}
        />
      )
    }
  }

  return (
    <dialog ref={dialogRef}>
      <header style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Orthographic Editor</h1>
        <button onClick={() => setIsOpen(false)} style={{ float: 'right' }}>Close</button>
      </header>
      <section style={{ height: '20rem' }}>
        <svg width='100%' height='100%' viewBox={`-1 -1 ${(map.length - 1) / 2 + 2} ${map[0].length + 2}`}>
          {...background}
          {...lines}
        </svg>
        {wrapWithExportContainer(<svg viewBox={`-1 -1 ${(map.length - 1) / 2 + 2} ${map[0].length + 2}`}>{...lines}</svg>, 'none')}
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
