import { useCallback, useEffect, useState } from 'react'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import { useShallow } from 'zustand/react/shallow'
import { CodedPlan } from './drawing/auxiliary/CodedPlan.tsx'
import { CodedPlanControls } from './drawing/control/CodedPlanControls.tsx'
import { CuboidStructureInputs } from './drawing/control/CuboidStructureInputs.tsx'
import { DrawingProvider } from './drawing/DrawingStore.tsx'
import { createExportBlob, openDownloadPopup, wrapWithExportContainer } from './export.tsx'
import { ExportDialog } from './dialog/ExportDialog.tsx'
import { IsometricControls } from './drawing/control/IsometricControls.tsx'
import { IsometricViewport } from './drawing/isometric/IsometricViewport.tsx'
import { OrthographicControls } from './drawing/control/OrthographicControls.tsx'
import { OrthographicEditorDialog } from './dialog/OrthographicEditorDialog.tsx'
import { OrthographicViews } from './drawing/auxiliary/OrthographicViews.tsx'
import { RotationButtons } from './drawing/control/RotationButtons.tsx'
import { SaveButton } from './SaveButton.tsx'
import { StoreDrawingControls } from './drawing/StoreDrawingControls.tsx'
import { useStore } from './Store.tsx'

function App() {
  const [
    setSupportsHover,
    highlightKind,
    setHighlightKind
  ] = useStore(useShallow((state) => [
    state.setSupportsHover,
    state.highlightKind,
    state.setHighlightKind
  ]))

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

    const media = window.matchMedia('(hover: hover)')
    setSupportsHover(media.matches)
    const supportsHoverChangedCallback = () => setSupportsHover(media.matches)
    media.addEventListener('change', supportsHoverChangedCallback)

    return () => {
      document.removeEventListener('keydown', keyDownCallback)
      document.removeEventListener('keyup', keyUpCallback)
      media.removeEventListener('change', supportsHoverChangedCallback)
    }
  })

  const [downloadUrl, setDownloadUrl] = useState('#')
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isOrthographicEditorDialogOpen, setIsOrthographicEditorDialogOpen] = useState(false)

  return (
    <DrawingProvider>
      <a id='download' href={downloadUrl} style={{ display: 'none' }}></a>
      <input type='checkbox' id='collapse-btn' style={{ display: 'none' }}/>
      <main style={{ display: 'flex', flexDirection: 'row', height: 'inherit' }}>
        <aside>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
            <SaveButton setDownloadUrl={setDownloadUrl} />
            <button onClick={() => setIsExportDialogOpen(true)}>Open Export Dialog</button>
            <button onClick={() => setIsOrthographicEditorDialogOpen(true)}>Open Orthographic Editor Dialog</button>
          </div>
          <hr />
          <StoreDrawingControls />
          <hr />
          <div id='isometric'>
            <label style={{ display: 'block' }}>
              Isometric Viewport:
              <span style={{ float: 'right' }}>
                <button onClick={async () => openDownloadPopup(await createExportBlob('#isometric .export-container svg', true), setDownloadUrl)}>Export PNG</button>
                <button onClick={async () => openDownloadPopup(await createExportBlob('#isometric .export-container svg', false), setDownloadUrl)}>Export SVG</button>
              </span>
            </label>
            <div>
              <IsometricControls />
            </div>
            {wrapWithExportContainer(<IsometricViewport canHaveUndefinedSize={true} />, 'none')}
          </div>
          <hr style={{ visibility: 'hidden' }} />
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 1000, height: 1000 }}>
                <IsometricViewport canHaveUndefinedSize={false} size={{ width: 600, height: 600, viewBox: '-20 -20 40 40'}} />
              </div>
            </TransformComponent>
          </TransformWrapper>
          <div style={{ position: 'fixed', right: '.5em', top: '2em' }}>
            <button onClick={() => setHighlightKind(highlightKind === 'cuboid' ? 'face' : 'cuboid')}>
              {highlightKind === 'cuboid' ? 'Deleting' : 'Building'}
            </button>
          </div>
          <div style={{ position: 'fixed', right: '.5em', bottom: '2em', width: '12rem', height: '6rem' }}>
            <RotationButtons />
          </div>
          <ExportDialog isOpen={isExportDialogOpen} setIsOpen={setIsExportDialogOpen} setDownloadUrl={setDownloadUrl} />
          <OrthographicEditorDialog isOpen={isOrthographicEditorDialogOpen} setIsOpen={setIsOrthographicEditorDialogOpen} setDownloadUrl={setDownloadUrl} />
        </section>
      </main>
    </DrawingProvider>
  )
}

export default App
