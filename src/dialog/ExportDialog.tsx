import { ExportCard } from './ExportCard.tsx'

type ExportDialogProps = {
  id: string
  setShouldContinueRender: (shouldContinueRender: boolean) => void
}

export function ExportDialog({ id, setShouldContinueRender }: ExportDialogProps) {
  const cards = [
    <ExportCard initialDrawingKind='isometric' />,
    <ExportCard initialDrawingKind='coded-plan' />,
    <ExportCard initialDrawingKind='orthographic' />
  ]

  return (
    <dialog id={id} className='export-dialog'>
      <header style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Export Archive</h1>
        <button onClick={() => setShouldContinueRender(false)} style={{ float: 'right' }}>Close</button>
      </header>
      <section style={{ display: 'flex', flexDirection: 'row', overflowX: 'scroll' }}>
        {...cards}
      </section>
    </dialog>
  )
}
