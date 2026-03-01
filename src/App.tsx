import type { HighlightKind } from './Store.tsx'
import { useCallback, useEffect, useRef, useState } from 'react'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import { useShallow } from 'zustand/react/shallow'
import { CodedPlan } from './drawing/auxiliary/CodedPlan.tsx'
import { CodedPlanControls } from './drawing/control/CodedPlanControls.tsx'
import { CuboidStructureInputs } from './drawing/control/CuboidStructureInputs.tsx'
import { DrawingsDialog } from './dialog/DrawingsDialog.tsx'
import { DrawingProvider } from './drawing/DrawingStore.tsx'
import { ExportButton } from './io/ExportButton.tsx'
import { ExportContainer } from './io/ExportContainer.tsx'
import { ExportDialog } from './dialog/ExportDialog.tsx'
import { IsometricControls } from './drawing/control/IsometricControls.tsx'
import { IsometricViewport } from './drawing/isometric/IsometricViewport.tsx'
import { OrthographicControls } from './drawing/control/OrthographicControls.tsx'
import { OrthographicEditorDialog } from './dialog/OrthographicEditorDialog.tsx'
import { OrthographicViews } from './drawing/auxiliary/OrthographicViews.tsx'
import { RotationButtons } from './drawing/control/RotationButtons.tsx'
import { SaveLoadButtons } from './io/SaveLoadButtons.tsx'
import { StoreDrawingControls } from './drawing/StoreDrawingControls.tsx'
import { defaultDrawingDefinition, useStore } from './Store.tsx'

function App() {
  const downloadAnchorRef = useRef<HTMLAnchorElement|null>(null)
  const isometricParentRef = useRef<HTMLDivElement|null>(null)
  const codedPlanParentRef = useRef<HTMLDivElement|null>(null)
  const orthographicParentRef = useRef<HTMLDivElement|null>(null)

  const [
    setSupportsHover,
    newDefinition
  ] = useStore(useShallow((state) => [
    state.setSupportsHover,
    state.newDefinition
  ]))

  const [highlightKind, setHighlightKind] = useState<HighlightKind>('face')

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

  const [appInitialDefinition, setAppInitialDefinition] = useState(defaultDrawingDefinition())
  const [isDrawingsDialogOpen, setIsDrawingsDialogOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [orthographicEditorDefinitionIndex, setOrthographicEditorDefinitionIndex] = useState<number|null>(null)

  return (
    <DrawingProvider initialDefinition={appInitialDefinition}>
      <a ref={downloadAnchorRef} style={{ display: 'none' }}></a>
      <input type='checkbox' id='collapse-btn' style={{ display: 'none' }}/>
      <main style={{ display: 'flex', flexDirection: 'row', height: 'inherit' }}>
        <aside>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
            <SaveLoadButtons
              setInitialDefinition={setAppInitialDefinition}
              downloadAnchor={downloadAnchorRef.current!}
            />
            <button onClick={() => setIsExportDialogOpen(true)}>Open Export Dialog</button>
            <button
              onClick={
                () => {
                  const name = prompt('Please enter the name of the drawing:', 'Untitled Drawing')
                  if (name === null) return
                  const definitionIndex = newDefinition('orthographic')
                  setOrthographicEditorDefinitionIndex(definitionIndex)
                }
              }
            >
              Create New Orthographic Drawing
            </button>
          </div>
          <hr />
          <StoreDrawingControls
            setInitialDefinition={setAppInitialDefinition}
            setIsDrawingsDialogOpen={setIsDrawingsDialogOpen}
          />
          <hr />
          <div ref={isometricParentRef}>
            <label style={{ display: 'block' }}>
              Isometric Viewport:
              <span style={{ float: 'right' }}>
                <ExportButton asPNG={true} containerParentRef={isometricParentRef} />
                <ExportButton asPNG={false} containerParentRef={isometricParentRef} />
              </span>
            </label>
            <div>
              <IsometricControls />
            </div>
            <ExportContainer display='none'>
              <IsometricViewport canHaveUndefinedSize={true} />
            </ExportContainer>
          </div>
          <hr style={{ visibility: 'hidden' }} />
          <div ref={codedPlanParentRef} style={{ position: 'relative', height: '30%' }}>
            <label style={{ display: 'block' }}>
              Coded Plan:
              <span style={{ float: 'right' }}>
                <ExportButton asPNG={true} containerParentRef={codedPlanParentRef} />
                <ExportButton asPNG={false} containerParentRef={codedPlanParentRef} />
              </span>
            </label>
            <div>
              <CodedPlanControls />
            </div>
            <div style={{ height: '80%' }}>
              <ExportContainer>
                <CodedPlan />
              </ExportContainer>
            </div>
          </div>
          <div ref={orthographicParentRef} style={{ position: 'relative', height: '30%' }}>
            <label style={{ display: 'block' }}>
              Orthographic Views:
              <span style={{ float: 'right' }}>
                <ExportButton asPNG={true} containerParentRef={orthographicParentRef} />
                <ExportButton asPNG={false} containerParentRef={orthographicParentRef} />
              </span>
            </label>
            <div>
              <OrthographicControls />
            </div>
            <div style={{ height: '80%' }}>
              <OrthographicViews isSplittable={false} />
              <ExportContainer display='none'>
                <OrthographicViews isSplittable={true} />
              </ExportContainer>
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
                <IsometricViewport
                  highlightKind={highlightKind}
                  canHaveUndefinedSize={false}
                  size={{ width: 600, height: 600, viewBox: '-20 -20 40 40'}}
                />
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
          <DrawingsDialog
            isOpen={isDrawingsDialogOpen}
            setIsOpen={setIsDrawingsDialogOpen}
            setInitialDefinition={setAppInitialDefinition}
            setOrthographicEditorDefinitionIndex={setOrthographicEditorDefinitionIndex}
          />
          <ExportDialog
            isOpen={isExportDialogOpen}
            setIsOpen={setIsExportDialogOpen}
            downloadAnchor={downloadAnchorRef.current!}
          />
          <OrthographicEditorDialog
            definitionIndex={orthographicEditorDefinitionIndex}
            setDefinitionIndex={setOrthographicEditorDefinitionIndex}
          />
        </section>
      </main>
    </DrawingProvider>
  )
}

export default App
