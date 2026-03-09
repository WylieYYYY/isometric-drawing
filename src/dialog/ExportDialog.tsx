import { useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Dialog } from './Dialog.tsx'
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

  return (
    <Dialog ref={dialogRef} isOpen={isOpen} close={() => setIsOpen(false)} title='Export Archive'>
      <section className='modal-body'>
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '0.5rem', overflow: 'scroll' }}>
          {...exportCards}
          <button onClick={() => newExportCard()} className='btn btn-outline-secondary'>+</button>
        </div>
      </section>
      <footer className='modal-footer' style={{ display: 'flex', justifyContent: 'space-between' }}>
        <ExportPresetControls parent={dialogRef.current!} downloadAnchor={downloadAnchor} className='btn btn-outline-secondary' />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label>
            Archive Name:
            <input value={archiveName} placeholder='export' onChange={(event) => setArchiveName(event.target.value)} />
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <ExportButton
              text='PNG Archive' asPNG={true}
              containerParentRef={dialogRef} filename={archiveName}
              className='btn btn-primary'
            />
            <ExportButton
              text='SVG Archive' asPNG={false}
              containerParentRef={dialogRef} filename={archiveName}
              className='btn btn-primary'
            />
          </div>
        </div>
      </footer>
    </Dialog>
  )
}
