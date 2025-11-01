import { useCallback, useEffect, useId, useState } from 'react'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import { CodedPlan } from './drawing/auxiliary/CodedPlan.tsx'
import { CodedPlanControls } from './drawing/control/CodedPlanControls.tsx'
import { CuboidStructureInputs } from './drawing/control/CuboidStructureInputs.tsx'
import { DrawingProvider } from './drawing/DrawingStore.tsx'
import { createExportBlob, openDownloadPopup, wrapWithExportContainer } from './export.tsx'
import { ExportDialog } from './dialog/ExportDialog.tsx'
import { IsometricControls } from './drawing/control/IsometricControls.tsx'
import { IsometricViewport } from './drawing/isometric/IsometricViewport.tsx'
import { OrthographicControls } from './drawing/control/OrthographicControls.tsx'
import { OrthographicViews } from './drawing/auxiliary/OrthographicViews.tsx'
import { RotationButtons } from './drawing/control/RotationButtons.tsx'
import { SaveButton } from './SaveButton.tsx'
import { useStore } from './Store.tsx'

function App() {
  const setHighlightKind = useStore((state) => state.setHighlightKind)

  const keyDownCallback = useCallback((event: KeyboardEvent) => {
    if (event.repeat || (event.key !== 'd' && event.code !== 'Delete')) return
    setHighlightKind('cuboid')
  }, [setHighlightKind])
  const keyUpCallback = useCallback((event: KeyboardEvent) => {
    if (event.repeat || (event.key !== 'd' && event.code !== 'Delete')) return
    setHighlightKind('face')
  }, [setHighlightKind])

  useEffect(() => {
    document.addEventListener('keydown', keyDownCallback)
    document.addEventListener('keyup', keyUpCallback)

    return () => {
      document.removeEventListener('keydown', keyDownCallback)
      document.removeEventListener('keyup', keyUpCallback)
    }
  })

  const exportDialogId = useId()

  const [downloadUrl, setDownloadUrl] = useState('#')
  const [shouldCropOnExport, setShouldCropOnExport] = useState(true)
  const [shouldContinueRenderExportDialog, setShouldContinueRenderExportDialog] = useState(false)

  const svgSelector = shouldCropOnExport ? '#background-render > svg' : '#foreground-viewport > svg'

  const exportDialog = document.getElementById(exportDialogId) as HTMLDialogElement|null
  if (shouldContinueRenderExportDialog) {
    exportDialog?.showModal()
  } else {
    exportDialog?.close()
  }

  return (
    <DrawingProvider>
      <a id='download' href={downloadUrl} style={{ display: 'none' }}></a>
      <input type='checkbox' id='collapse-btn' style={{ display: 'none' }}/>
      <main style={{ display: 'flex', flexDirection: 'row', height: 'inherit' }}>
        <aside>
          <div id='background-render' style={{ display: 'none' }}>
            <IsometricViewport />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
            <IsometricControls />
            <SaveButton setDownloadUrl={setDownloadUrl} />
            <div style={{ display: 'flex' }}>
              <input type='checkbox' name='crop-chk' checked={shouldCropOnExport} onChange={(event) => setShouldCropOnExport(event.target.checked)} />
              <label htmlFor='crop-chk'>Crop on export</label>
            </div>
            <button onClick={async () => openDownloadPopup(await createExportBlob(svgSelector, true), setDownloadUrl)}>Export PNG</button>
            <button onClick={async () => openDownloadPopup(await createExportBlob(svgSelector, false), setDownloadUrl)}>Export SVG</button>
            <button onClick={() => setShouldContinueRenderExportDialog(true)}>Open Export Dialog</button>
          </div>
          <hr />
          <div id='coded-plan' style={{ position: 'relative', height: '30%' }}>
            <label style={{ display: 'block' }}>
              Coded Plan:
              <span style={{ float: 'right' }}>
                <button onClick={async () => openDownloadPopup(await createExportBlob('#coded-plan svg', true), setDownloadUrl)}>Export PNG</button>
                <button onClick={async () => openDownloadPopup(await createExportBlob('#coded-plan svg', false), setDownloadUrl)}>Export SVG</button>
              </span>
            </label>
            <div>
              <CodedPlanControls />
            </div>
            <div style={{ height: '80%' }}>
              <CodedPlan />
            </div>
          </div>
          <div id='orthographic' style={{ position: 'relative', height: '30%' }}>
            <label style={{ display: 'block' }}>
              Orthographic Views:
              <span style={{ float: 'right' }}>
                <button onClick={async () => openDownloadPopup(await createExportBlob('#orthographic .export-container svg', true), setDownloadUrl)}>Export PNG</button>
                <button onClick={async () => openDownloadPopup(await createExportBlob('#orthographic .export-container svg', false), setDownloadUrl)}>Export SVG</button>
              </span>
            </label>
            <div>
              <OrthographicControls />
            </div>
            <div style={{ height: '80%' }}>
              <OrthographicViews isSplittable={false} />
              {wrapWithExportContainer(<OrthographicViews isSplittable={true} />, 'none')}
            </div>
          </div>
          <hr />
          <div style={{ maxHeight: '30%', overflowX: 'hidden', overflowY: 'scroll' }}>
            <details>
              <summary>Cuboid Structure Inputs</summary>
              <CuboidStructureInputs />
            </details>
          </div>
        </aside>
        <label htmlFor='collapse-btn' role='button'>
          <div style={{ writingMode: 'vertical-rl' }}>
            <span id='open-lbl'>open</span>
            <span id='close-lbl'>close</span>
            <span>&nbsp;menu</span>
          </div>
        </label>
        <section>
          <TransformWrapper centerOnInit={true} initialScale={8}>
            <TransformComponent wrapperStyle={{ width: '100%', height: 'inherit' }}>
              <div id='foreground-viewport' style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 1000, height: 1000 }}>
                <IsometricViewport size={{ width: 600, height: 600, viewBox: '-20 -20 40 40'}} />
              </div>
            </TransformComponent>
          </TransformWrapper>
          <div style={{ position: 'fixed', right: '.5em', bottom: '2em', width: '12rem', height: '6rem' }}>
            <RotationButtons />
          </div>
          <ExportDialog id={exportDialogId} setShouldContinueRender={setShouldContinueRenderExportDialog} setDownloadUrl={setDownloadUrl} />
        </section>
      </main>
    </DrawingProvider>
  )
}

export default App
