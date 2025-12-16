import type { ReactNode } from 'react'
import type { DrawingPreference } from './../drawing/DrawingStore.tsx'
import type { LineType } from './OrthographicEditorLine.tsx'
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

export type DrawingKind = 'isometric' | 'coded-plan' | 'orthographic' | 'orthographic-editor'

export type ExportCardProps = {
  initialDrawingKind?: DrawingKind
  initialPreference?: Partial<DrawingPreference>
  deleteCallback: () => void
  startWithPlaceholder?: boolean
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
  initialDrawingKind?: Exclude<DrawingKind, 'orthographic-editor'>
  drawings: Array<TaggedDefinition|null>
  deleteCallback: () => void
  selectedDrawingIndex: number
  setSelectedDrawingIndex: (selectedDrawingIndex: number) => void
}

/** Drawing index to use to represent the potentially unsaved drawing on the main viewport. */
const SENTINEL_CURRENT_DRAWING_INDEX = -1
/** Drawing index to use for the placeholder after loading a preset. */
const SENTINEL_PLACEHOLDER_DRAWING_INDEX = -2

/** Placeholder orthographic editor map, shapes like a `P`. */
const PLACEHOLDER_ORTHOGRAPHIC_EDITOR_MAP: Array<Array<LineType>> = [
  [1, 1],
  [1, 1, 0],
  [0, 0],
  [1, 1, 0],
  [1, 0]
]

/** Cuboid values for the placeholder drawing definition, shapes like a `P`. */
const PLACEHOLDER_DRAWING_DEFINITION_CUBOID_VALUES = [
  { x: '0', y: '0', z: '0', dx: '1', dy: '5', dz: '1' },
  { x: '1', y: '2', z: '0', dx: '3', dy: '1', dz: '1' },
  { x: '3', y: '3', z: '0', dx: '1', dy: '1', dz: '1' },
  { x: '1', y: '4', z: '0', dx: '3', dy: '1', dz: '1' }
]

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
          {selectedDrawingIndex === SENTINEL_PLACEHOLDER_DRAWING_INDEX ? <option value={SENTINEL_PLACEHOLDER_DRAWING_INDEX}>Select Drawing...</option> : null}
          <option value={SENTINEL_CURRENT_DRAWING_INDEX}>[Current Drawing]</option>
          {...drawings.filter((drawing) => drawing !== null).map(({ definition: { drawingIndex, name } }) => <option value={drawingIndex!.toString()}>{name}</option>)}
        </select>
      </label>
      {controls}
    </div>
  )
}

/** Card to use when the definition is a drawing definition. */
function DrawingDefinitionCard({ initialDrawingKind, drawings, deleteCallback, selectedDrawingIndex, setSelectedDrawingIndex } : DrawingDefinitionCardProps) {
  const preference = useDrawingStore(useShallow((state) => ({
    shouldCropIsometricViewport: state.shouldCropIsometricViewport,
    shouldShowIsometricGrid: state.shouldShowIsometricGrid,
    shouldShowAxisArrows: state.shouldShowAxisArrows,
    shouldShowIsometricStructure: state.shouldShowIsometricStructure,
    shouldShowCodedPlanNumbers: state.shouldShowCodedPlanNumbers,
    shouldSplitOrthographicViewsAsThree: state.shouldSplitOrthographicViewsAsThree,
    shouldShowOrthographicViewsGrid: state.shouldShowOrthographicViewsGrid,
    shouldShowOrthographicStructure: state.shouldShowOrthographicStructure
  })))

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
    <>
      <span className='data-container' data-preset-json={JSON.stringify({ drawingKind, ...preference })}></span>
      <TemplateCard
        drawings={drawings}
        deleteCallback={deleteCallback}
        drawing={drawing}
        selectedDrawingIndex={selectedDrawingIndex}
        setSelectedDrawingIndex={setSelectedDrawingIndex}
        controls={controls}
      />
    </>
  )
}

/** Card in export dialog that display a preview with its control and exposes an export container. */
export function ExportCard({ initialDrawingKind, initialPreference, deleteCallback, startWithPlaceholder }: ExportCardProps) {
  const drawings = useStore((state) => state.drawings)

  const [
    cuboidValues,
    rotation
  ] = useDrawingStore(useShallow((state) => [
    state.cuboidValues,
    state.rotation
  ]))

  // current drawing as the default, no index is suitable as the current drawing may be unsaved
  const initialIndex = (
    (startWithPlaceholder ?? false) || initialDrawingKind === 'orthographic-editor' ?
    SENTINEL_PLACEHOLDER_DRAWING_INDEX : SENTINEL_CURRENT_DRAWING_INDEX
  )
  const [selectedDrawingIndex, setSelectedDrawingIndex] = useState<number>(initialIndex)

  if (initialDrawingKind === 'orthographic-editor' && selectedDrawingIndex === SENTINEL_PLACEHOLDER_DRAWING_INDEX) {
    return (
      <>
        <span className='data-container' data-preset-json={JSON.stringify({ drawingKind: 'orthographic-editor' })}></span>
        <TemplateCard
          drawings={drawings}
          deleteCallback={deleteCallback}
          drawing={wrapWithExportContainer(<OrthographicEditor map={PLACEHOLDER_ORTHOGRAPHIC_EDITOR_MAP} />)}
          selectedDrawingIndex={selectedDrawingIndex}
          setSelectedDrawingIndex={setSelectedDrawingIndex}
          controls={null}
        />
      </>
    )
  }

  if (drawings[selectedDrawingIndex]?.definitionKind === 'orthographic') {
    return (
      <>
        <span className='data-container' data-preset-json={JSON.stringify({ drawingKind: 'orthographic-editor' })}></span>
        <TemplateCard
          drawings={drawings}
          deleteCallback={deleteCallback}
          drawing={wrapWithExportContainer(<OrthographicEditor map={drawings[selectedDrawingIndex].definition.map} />)}
          selectedDrawingIndex={selectedDrawingIndex}
          setSelectedDrawingIndex={setSelectedDrawingIndex}
          controls={null}
        />
      </>
    )
  }

  // the definition is deleted while the card is displaying it
  // set the card to the current drawing as a fallback without self deleting
  if (selectedDrawingIndex !== SENTINEL_CURRENT_DRAWING_INDEX && drawings[selectedDrawingIndex] === null) {
    setSelectedDrawingIndex(SENTINEL_CURRENT_DRAWING_INDEX)
  }

  let initialDefinition
  switch (selectedDrawingIndex) {
    case SENTINEL_CURRENT_DRAWING_INDEX:
      // This card is not wrapped in a more specific drawing provider
      // so this takes from the outer most drawing provider
      initialDefinition = {
        drawingIndex: null,
        name: '',
        cuboidValues: structuredClone(cuboidValues),
        rotation: rotation.clone()
      }
      break
    case SENTINEL_PLACEHOLDER_DRAWING_INDEX:
      initialDefinition = {
        drawingIndex: null,
        name: '',
        cuboidValues: PLACEHOLDER_DRAWING_DEFINITION_CUBOID_VALUES,
        rotation: new Quaternion()
      }
      break
    default: {
      // the drawing should not be null as the index would have set to SENTINEL_CURRENT_DRAWING_INDEX
      const { definition: { rotation, ...rest } } = drawings[selectedDrawingIndex]!
      initialDefinition = { rotation: new Quaternion(rotation), ...rest }
      break
    }
  }

  return (
    <DrawingProvider initialDefinition={{ isInteractive: false, ...initialDefinition, ...initialPreference }}>
      <DrawingDefinitionCard
        initialDrawingKind={initialDrawingKind === 'orthographic-editor' ? 'isometric' : initialDrawingKind}
        drawings={drawings}
        deleteCallback={deleteCallback}
        selectedDrawingIndex={selectedDrawingIndex}
        setSelectedDrawingIndex={setSelectedDrawingIndex}
      />
    </DrawingProvider>
  )
}
