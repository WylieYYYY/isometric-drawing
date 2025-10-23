import type { IOptions } from 'canvg'
import { Canvg, presets } from 'canvg'
import { useCallback, useEffect, useId, useState } from 'react'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import { CodedPlan } from './CodedPlan.tsx'
import { CuboidStructureInputs } from './CuboidStructureInputs.tsx'
import { DrawingProvider } from './isometric/DrawingStore.tsx'
import { ExportDialog } from './dialog/ExportDialog.tsx'
import { IsometricViewport } from './isometric/IsometricViewport.tsx'
import { OrthographicViews } from './OrthographicViews.tsx'
import { RotationButtons } from './isometric/control/RotationButtons.tsx'
import { SaveButton } from './SaveButton.tsx'
import { useStore } from './Store.tsx'

const BLOB_URL_TIMEOUT = 500

function downloadSVG(svgSelector: string, setDownloadUrl: (downloadUrl: string) => void) {
  const svg = document.querySelector(svgSelector)!
  const anchor = document.getElementById('download') as HTMLAnchorElement

  const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' })
  setDownloadUrl(URL.createObjectURL(blob))
  anchor.download = 'export.svg'
  setTimeout(() => anchor.click(), BLOB_URL_TIMEOUT)
}

async function downloadPNG(svgSelector: string, setDownloadUrl: (downloadUrl: string) => void, width: number, height: number) {
  const svg = document.querySelector(svgSelector)!
  const anchor = document.getElementById('download') as HTMLAnchorElement

  const canvas = new OffscreenCanvas(0, 0)
  const ctx = canvas.getContext('2d')!
  const canvg = await Canvg.from(ctx, svg.outerHTML, presets.offscreen() as IOptions)
  canvg.resize(width, height)

  await canvg.render()

  const blob = await canvas.convertToBlob()
  setDownloadUrl(URL.createObjectURL(blob))
  anchor.download = 'export.png'
  setTimeout(() => anchor.click(), BLOB_URL_TIMEOUT)
}

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
  const [shouldShowGrid, setShouldShowGrid] = useState(true)
  const [shouldShowAxisArrows, setShouldShowAxisArrows] = useState(true)
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
            <IsometricViewport shouldShowGrid={shouldShowGrid} shouldShowAxisArrows={shouldShowAxisArrows} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
            <button onClick={() => setShouldShowGrid(!shouldShowGrid)}>Toggle Grid</button>
            <button onClick={() => setShouldShowAxisArrows(!shouldShowAxisArrows)}>Toggle Axis Arrows</button>
            <SaveButton setDownloadUrl={setDownloadUrl} />
            <div style={{ display: 'flex' }}>
              <input type='checkbox' name='crop-chk' checked={shouldCropOnExport} onChange={(event) => setShouldCropOnExport(event.target.checked)} />
              <label htmlFor='crop-chk'>Crop on export</label>
            </div>
            <button onClick={() => downloadPNG(svgSelector, setDownloadUrl, 2400, 2400)}>Export PNG</button>
            <button onClick={() => downloadSVG(svgSelector, setDownloadUrl)}>Export SVG</button>
            <button onClick={() => setShouldContinueRenderExportDialog(true)}>Open Export Dialog</button>
          </div>
          <hr />
          <div style={{ position: 'relative', height: '20%' }}>
            <label style={{ display: 'block' }}>Coded Plan:</label>
            <CodedPlan />
          </div>
          <div style={{ position: 'relative', height: '20%' }}>
            <label style={{ display: 'block' }}>Orthographic Views:</label>
            <OrthographicViews />
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
                <IsometricViewport shouldShowGrid={shouldShowGrid} shouldShowAxisArrows={shouldShowAxisArrows} size={{ width: 600, height: 600, viewBox: '-20 -20 40 40'}} />
              </div>
            </TransformComponent>
          </TransformWrapper>
          <div style={{ position: 'fixed', right: '.5em', bottom: '2em', display: 'flex', flexDirection: 'column' }}>
            <RotationButtons />
          </div>
          <ExportDialog id={exportDialogId} setShouldContinueRender={setShouldContinueRenderExportDialog} />
        </section>
      </main>
    </DrawingProvider>
  )
}

export default App
