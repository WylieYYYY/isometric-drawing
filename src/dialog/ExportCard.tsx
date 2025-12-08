import type { ReactNode } from 'react'
import type { TaggedDefinition } from './../Store.tsx'
import { Quaternion } from 'quaternion'
import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { CodedPlan } from './../drawing/auxiliary/CodedPlan.tsx'
import { CodedPlanControls } from './../drawing/control/CodedPlanControls.tsx'
import { DrawingProvider } from './../drawing/DrawingStore.tsx'
import { useDrawingStore } from './../drawing/DrawingStoreHook.ts'
import { wrapWithExportContainer } from './../export.tsx'
import { IsometricViewport } from './../drawing/isometric/IsometricViewport.tsx'
import { IsometricControls } from './../drawing/control/IsometricControls.tsx'
import { OrthographicControls } from './../drawing/control/OrthographicControls.tsx'
import { OrthographicEditor } from './OrthographicEditor.tsx'
import { OrthographicViews } from './../drawing/auxiliary/OrthographicViews.tsx'
import { RotationButtons } from './../drawing/control/RotationButtons.tsx'
import { useStore } from './../Store.tsx'

type DrawingKind = 'isometric' | 'coded-plan' | 'orthographic'

type ExportCardProps = {
  initialDrawingKind?: DrawingKind
  deleteCallback: () => void
}

type TemplateCardProps = {
  drawings: Array<TaggedDefinition|null>
  deleteCallback: () => void
  drawing: ReactNode
  selectedDrawingIndex: number
  setSelectedDrawingIndex: (selectedDrawingIndex: number) => void
  controls: ReactNode
}

type DrawingDefinitionCardProps = {
  initialDrawingKind?: DrawingKind
  drawings: Array<TaggedDefinition|null>
  deleteCallback: () => void
  selectedDrawingIndex: number
  setSelectedDrawingIndex: (selectedDrawingIndex: number) => void
}

/**
 * Base template card to be used by all definitions.
 * Preview can be customized via `drawing` and controls can be customized via `controls`.
 */
function TemplateCard({ drawings, deleteCallback, drawing, selectedDrawingIndex, setSelectedDrawingIndex, controls } : TemplateCardProps) {
  return (
    <div style={{ width: 'calc(16rem + 4px)', marginRight: '0.5rem', padding: '0.5rem', border: '2px solid black' }}>
      <div style={{ display: 'flex', justifyContent: 'end' }}>
        <button onClick={deleteCallback}>Delete</button>
      </div>
      <div style={{ width: '16rem', height: '8rem', border: '2px solid black' }}>
        {drawing}
      </div>
      <label style={{ display: 'block' }}>
        Drawing:
        <select value={selectedDrawingIndex} onChange={(event) => setSelectedDrawingIndex(parseInt(event.target.value))}>
          <option value='-1'>[Current Drawing]</option>
          {...drawings.filter((drawing) => drawing !== null).map(({ definition: { drawingIndex, name } }) => <option value={drawingIndex!.toString()}>{name}</option>)}
        </select>
      </label>
      {controls}
    </div>
  )
}

/** Card to use when the definition is a drawing definition. */
function DrawingDefinitionCard({ initialDrawingKind, drawings, deleteCallback, selectedDrawingIndex, setSelectedDrawingIndex } : DrawingDefinitionCardProps) {
  const [drawingKind, setDrawingKind] = useState<DrawingKind>(initialDrawingKind ?? 'isometric')

  let drawing, control
  switch (drawingKind) {
    case 'isometric':
      drawing = (
        <>
          <IsometricViewport canHaveUndefinedSize={false} size={{ width: '100%', height: '100%' }} />
          {wrapWithExportContainer(<IsometricViewport canHaveUndefinedSize={true} />, 'none')}
        </>
      )
      control = <IsometricControls />
      break
    case 'coded-plan':
      drawing = wrapWithExportContainer(<CodedPlan />)
      control = <CodedPlanControls />
      break
    case 'orthographic':
      drawing = (
        <>
          <OrthographicViews isSplittable={false} />
          {wrapWithExportContainer(<OrthographicViews isSplittable={true} />, 'none')}
        </>
      )
      control = <OrthographicControls />
      break
  }

  const controls = (
    <>
      <label>
        Drawing Kind:
        <select value={drawingKind} onChange={(event) => setDrawingKind(event.target.value as DrawingKind)}>
          <option value='isometric'>Isometric</option>
          <option value='coded-plan'>Coded Plan</option>
          <option value='orthographic'>Orthographic</option>
        </select>
      </label>
      <div style={{ display: 'flex' }}>
        <div style={{ width: '8rem' }}>
          <RotationButtons />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {control}
        </div>
      </div>
    </>
  )

  return (
    <TemplateCard
      drawings={drawings}
      deleteCallback={deleteCallback}
      drawing={drawing}
      selectedDrawingIndex={selectedDrawingIndex}
      setSelectedDrawingIndex={setSelectedDrawingIndex}
      controls={controls}
    />
  )
}

/** Card in export dialog that display a preview with its control and exposes an export container. */
export function ExportCard({ initialDrawingKind, deleteCallback }: ExportCardProps) {
  const drawings = useStore((state) => state.drawings)

  const [
    cuboidValues,
    rotation
  ] = useDrawingStore(useShallow((state) => [
    state.cuboidValues,
    state.rotation
  ]))

  // current drawing as the default, no index is suitable as the current drawing may be unsaved
  const [selectedDrawingIndex, setSelectedDrawingIndex] = useState<number>(-1)

  if (drawings[selectedDrawingIndex]?.definitionKind === 'orthographic') {
    return (
      <TemplateCard
        drawings={drawings}
        deleteCallback={deleteCallback}
        drawing={wrapWithExportContainer(<OrthographicEditor map={drawings[selectedDrawingIndex].definition.map} />)}
        selectedDrawingIndex={selectedDrawingIndex}
        setSelectedDrawingIndex={setSelectedDrawingIndex}
        controls={null}
      />
    )
  }

  // the definition is deleted while the card is displaying it
  // set the card to the current drawing as a fallback without self deleting
  if (selectedDrawingIndex !== -1 && drawings[selectedDrawingIndex] === null) {
    setSelectedDrawingIndex(-1)
  }

  let initialDefinition
  if (selectedDrawingIndex === -1) {
    // This card is not wrapped in a more specific drawing provider
    // so this takes from the outer most drawing provider
    initialDefinition = {
      drawingIndex: null,
      name: '',
      cuboidValues: structuredClone(cuboidValues),
      rotation: rotation.clone()
    }
  } else {
    // the drawing should not be null as the index would have set to -1
    const { definition: { rotation, ...rest } } = drawings[selectedDrawingIndex]!
    initialDefinition = { rotation: new Quaternion(rotation), ...rest }
  }

  return (
    <DrawingProvider initialDefinition={{ isInteractive: false, ...initialDefinition }}>
      <DrawingDefinitionCard
        initialDrawingKind={initialDrawingKind}
        drawings={drawings}
        deleteCallback={deleteCallback}
        selectedDrawingIndex={selectedDrawingIndex}
        setSelectedDrawingIndex={setSelectedDrawingIndex}
      />
    </DrawingProvider>
  )
}
