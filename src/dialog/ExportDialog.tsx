import { useShallow } from 'zustand/react/shallow'
import { createExportBlob, openDownloadPopup } from './../export.tsx'
import { useStore } from './../Store.tsx'

type ExportDialogProps = {
  id: string
  setShouldContinueRender: (shouldContinueRender: boolean) => void
  setDownloadUrl: (downloadUrl: string) => void
}

export function ExportDialog({ id, setShouldContinueRender, setDownloadUrl }: ExportDialogProps) {
  const [
    exportCards,
    newExportCard
  ] = useStore(useShallow((state) => [
    state.exportCards,
    state.newExportCard
  ]))

  return (
    <dialog id={id} className='export-dialog'>
      <header style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Export Archive</h1>
        <button onClick={() => setShouldContinueRender(false)} style={{ float: 'right' }}>Close</button>
      </header>
      <section style={{ display: 'flex', flexDirection: 'row', overflowX: 'scroll' }}>
        {...exportCards}
        <button onClick={newExportCard}>+</button>
      </section>
      <footer>
        <button
          onClick={async () => openDownloadPopup(await createExportBlob(`#${id} .export-container svg`, false), setDownloadUrl)}
          style={{ float: 'right' }}
        >
          Export SVG Archive
        </button>
        <button
          onClick={async () => openDownloadPopup(await createExportBlob(`#${id} .export-container svg`, true), setDownloadUrl)}
          style={{ float: 'right' }}
        >
          Export PNG Archive
        </button>
      </footer>
    </dialog>
  )
}
