import { BlobWriter, TextReader, ZipWriter } from "@zip.js/zip.js"
import { useShallow } from 'zustand/react/shallow'
import { useStore } from './../Store.tsx'

type ExportDialogProps = {
  id: string
  setShouldContinueRender: (shouldContinueRender: boolean) => void
  setDownloadUrl: (downloadUrl: string) => void
}

const BLOB_URL_TIMEOUT = 500

async function downloadArchive(svgSelector: string, setDownloadUrl: (downloadUrl: string) => void) {
  const svgs = document.querySelectorAll(svgSelector)
  const anchor = document.getElementById('download') as HTMLAnchorElement
  const zipFileWriter = new BlobWriter()

  const zipWriter = new ZipWriter(zipFileWriter)
  for (const [index, svg] of svgs.entries()) {
    const svgReader = new TextReader(svg.outerHTML)
    await zipWriter.add(`${index}.svg`, svgReader)
  }
  await zipWriter.close()

  setDownloadUrl(URL.createObjectURL(await zipFileWriter.getData()))
  anchor.download = 'archive.zip'
  setTimeout(() => anchor.click(), BLOB_URL_TIMEOUT)
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
          onClick={() => downloadArchive(`#${id} .export-container svg`, setDownloadUrl)}
          style={{ float: 'right' }}
        >
          Export Archive
        </button>
      </footer>
    </dialog>
  )
}
