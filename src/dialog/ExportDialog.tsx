import { useEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { ExportButton } from './../io/ExportButton.tsx'
import { ExportPresetControls } from './ExportPresetControls.tsx'
import { useStore } from './../Store.tsx'

type ExportDialogProps = {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  downloadAnchor: HTMLAnchorElement
}

/**
 * Dialog for archive export of definitions.
 * Dialogs exist in tree at all time, only the visibility is toggled.
 */
export function ExportDialog({ isOpen, setIsOpen, downloadAnchor }: ExportDialogProps) {
  const dialogRef = useRef<HTMLDialogElement|null>(null)

  const [
    exportCards,
    newExportCard
  ] = useStore(useShallow((state) => [
    state.exportCards,
    state.newExportCard
  ]))

  const [archiveName, setArchiveName] = useState('')

  useEffect(() => {
    if (!isOpen) return
    const dialog = dialogRef.current!
    dialog.showModal()
    return () => dialog.close()
  }, [isOpen])

  return (
    <dialog ref={dialogRef}>
      <header style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Export Archive</h1>
        <button onClick={() => setIsOpen(false)} style={{ float: 'right' }}>Close</button>
      </header>
      <section style={{ display: 'flex', flexDirection: 'row', overflowX: 'scroll' }}>
        {...exportCards}
        <button onClick={() => newExportCard()}>+</button>
      </section>
      <footer>
        <label>
          Archive Name:
          <input value={archiveName} placeholder='export' onChange={(event) => setArchiveName(event.target.value)} />
        </label>
        <ExportPresetControls parent={dialogRef.current!} downloadAnchor={downloadAnchor} />
        <div style={{ float: 'right' }}>
          <ExportButton text='PNG Archive' asPNG={true} containerParentRef={dialogRef} filename={archiveName} />
          <ExportButton text='SVG Archive' asPNG={false} containerParentRef={dialogRef} filename={archiveName} />
        </div>
      </footer>
    </dialog>
  )
}
