import { useEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { createExportBlob, openDownloadPopup } from './../export.tsx'
import { useStore } from './../Store.tsx'

type ExportDialogProps = {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  setDownloadUrl: (downloadUrl: string) => void
}

/**
 * Dialog for archive export of drawings.
 * Dialogs exist in tree at all time, only the visibility is toggled.
 */
export function ExportDialog({ isOpen, setIsOpen, setDownloadUrl }: ExportDialogProps) {
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
        <button onClick={newExportCard}>+</button>
      </section>
      <footer>
        <label>
          Archive Name:
          <input value={archiveName} placeholder='export' onChange={(event) => setArchiveName(event.target.value)} />
        </label>
        <button
          onClick={async () => openDownloadPopup(await createExportBlob(`.export-container svg`, false, dialogRef.current!), setDownloadUrl, archiveName)}
          style={{ float: 'right' }}
        >
          Export SVG Archive
        </button>
        <button
          onClick={async () => openDownloadPopup(await createExportBlob(`.export-container svg`, true, dialogRef.current!), setDownloadUrl, archiveName)}
          style={{ float: 'right' }}
        >
          Export PNG Archive
        </button>
      </footer>
    </dialog>
  )
}
