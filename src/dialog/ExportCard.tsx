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
import { ExportContainer } from './../io/ExportContainer.tsx'
import { IsometricViewport } from './../drawing/isometric/IsometricViewport.tsx'
import { IsometricControls } from './../drawing/control/IsometricControls.tsx'
import { OrthographicControls } from './../drawing/control/OrthographicControls.tsx'
import { OrthographicEditor } from './OrthographicEditor.tsx'
import { OrthographicViews } from './../drawing/auxiliary/OrthographicViews.tsx'
import { RotationButtons } from './../drawing/control/RotationButtons.tsx'
import { useStore } from './../Store.tsx'

/** Drawing kinds that have different preference and displays in export cards. */
export type DrawingKind = 'isometric' | 'coded-plan' | 'orthographic' | 'orthographic-editor'

export type ExportCardProps = {
  initialDrawingKind?: DrawingKind
  initialPreference?: Partial<DrawingPreference>
  deleteCallback: () => void
  startWithPlaceholder?: boolean
}

type TemplateCardProps = {
  definitions: Array<TaggedDefinition|null>
  deleteCallback: () => void
  preview: ReactNode
  selectedDefinitionIndex: number
  setSelectedDefinitionIndex: (selectedDefinitionIndex: number) => void
  controls: ReactNode
}

type DrawingDefinitionCardProps = {
  initialDrawingKind?: Exclude<DrawingKind, 'orthographic-editor'>
  definitions: Array<TaggedDefinition|null>
  deleteCallback: () => void
  selectedDefinitionIndex: number
  setSelectedDefinitionIndex: (selectedDefinitionIndex: number) => void
}

/** Drawing index to use to represent the potentially unsaved drawing on the main viewport. */
const SENTINEL_CURRENT_DEFINITION_INDEX = -1
/** Drawing index to use for the placeholder after loading a preset. */
const SENTINEL_PLACEHOLDER_DEFINITION_INDEX = -2

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
  { x: 0, y: 0, z: 0, dx: 1, dy: 5, dz: 1 },
  { x: 1, y: 2, z: 0, dx: 3, dy: 1, dz: 1 },
  { x: 3, y: 3, z: 0, dx: 1, dy: 1, dz: 1 },
  { x: 1, y: 4, z: 0, dx: 3, dy: 1, dz: 1 }
]

/**
 * Base template card to be used by all definitions.
 * Preview can be customized via `drawing` and controls can be customized via `controls`.
 */
function TemplateCard({ definitions, deleteCallback, preview, selectedDefinitionIndex, setSelectedDefinitionIndex, controls } : TemplateCardProps) {
  return (
    <div className='card'>
      <div className='card-header'>
      <label>
        <span className='visually-hidden'>Drawing:</span>
        <select value={selectedDefinitionIndex} onChange={(event) => setSelectedDefinitionIndex(parseInt(event.target.value))}>
          {selectedDefinitionIndex === SENTINEL_PLACEHOLDER_DEFINITION_INDEX ? <option value={SENTINEL_PLACEHOLDER_DEFINITION_INDEX}>Select Drawing...</option> : null}
          <option value={SENTINEL_CURRENT_DEFINITION_INDEX}>[Current Drawing]</option>
          {...definitions.filter((definition) => definition !== null).map(({ definition: { definitionIndex, name } }) => <option value={definitionIndex!.toString()}>{name}</option>)}
        </select>
      </label>
        <button onClick={deleteCallback} className='btn-close' style={{ float: 'right' }}></button>
      </div>
      <div className='card-body'>
        <div className='preview'>
          {preview}
        </div>
        {controls}
      </div>
    </div>
  )
}

/** Card to use when the definition is a drawing definition. */
function DrawingDefinitionCard({ initialDrawingKind, definitions, deleteCallback, selectedDefinitionIndex, setSelectedDefinitionIndex } : DrawingDefinitionCardProps) {
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

  let preview, control
  switch (drawingKind) {
    case 'isometric':
      preview = (
        <>
          <IsometricViewport canHaveUndefinedSize={false} size={{ width: '100%', height: '100%' }} />
          <ExportContainer display='none'>
            <IsometricViewport canHaveUndefinedSize={true} />
          </ExportContainer>
        </>
      )
      control = <IsometricControls />
      break
    case 'coded-plan':
      preview = (
        <ExportContainer>
          <CodedPlan />
        </ExportContainer>
      )
      control = <CodedPlanControls />
      break
    case 'orthographic':
      preview = (
        <>
          <OrthographicViews isSplittable={false} />
          <ExportContainer display='none'>
            <OrthographicViews isSplittable={true} />
          </ExportContainer>
        </>
      )
      control = <OrthographicControls />
      break
  }

  const controls = (
    <>
      <span className='data-container' data-preset-json={JSON.stringify({ drawingKind, ...preference })}></span>
      <label>
        Drawing Kind:
        <select value={drawingKind} onChange={(event) => setDrawingKind(event.target.value as DrawingKind)}>
          <option value='isometric'>Isometric</option>
          <option value='coded-plan'>Coded Plan</option>
          <option value='orthographic'>Orthographic</option>
        </select>
      </label>
      <hr />
      <div style={{ display: 'flex' }}>
        <div style={{ width: '8rem' }}>
          <RotationButtons />
        </div>
        <div className='vr' style={{ margin: '0 0.5rem' }}></div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {control}
        </div>
      </div>
    </>
  )

  return (
    <TemplateCard
      definitions={definitions}
      deleteCallback={deleteCallback}
      preview={preview}
      selectedDefinitionIndex={selectedDefinitionIndex}
      setSelectedDefinitionIndex={setSelectedDefinitionIndex}
      controls={controls}
    />
  )
}

/** Card in export dialog that display a preview with its control and exposes an export container. */
export function ExportCard({ initialDrawingKind, initialPreference, deleteCallback, startWithPlaceholder }: ExportCardProps) {
  const definitions = useStore((state) => state.definitions)

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
    SENTINEL_PLACEHOLDER_DEFINITION_INDEX : SENTINEL_CURRENT_DEFINITION_INDEX
  )
  const [selectedDefinitionIndex, setSelectedDefinitionIndex] = useState<number>(initialIndex)

  if (initialDrawingKind === 'orthographic-editor' && selectedDefinitionIndex === SENTINEL_PLACEHOLDER_DEFINITION_INDEX) {
    return (
      <TemplateCard
        definitions={definitions}
        deleteCallback={deleteCallback}
        preview={
          <ExportContainer>
            <OrthographicEditor map={PLACEHOLDER_ORTHOGRAPHIC_EDITOR_MAP} />
          </ExportContainer>
        }
        selectedDefinitionIndex={selectedDefinitionIndex}
        setSelectedDefinitionIndex={setSelectedDefinitionIndex}
        controls={
          <span className='data-container' data-preset-json={JSON.stringify({ drawingKind: 'orthographic-editor' })}></span>
        }
      />
    )
  }

  if (definitions[selectedDefinitionIndex]?.definitionKind === 'orthographic') {
    return (
      <TemplateCard
        definitions={definitions}
        deleteCallback={deleteCallback}
        preview={
          <ExportContainer>
            <OrthographicEditor map={definitions[selectedDefinitionIndex].definition.map} />
          </ExportContainer>
        }
        selectedDefinitionIndex={selectedDefinitionIndex}
        setSelectedDefinitionIndex={setSelectedDefinitionIndex}
        controls={
          <span className='data-container' data-preset-json={JSON.stringify({ drawingKind: 'orthographic-editor' })}></span>
        }
      />
    )
  }

  // the definition is deleted while the card is displaying it
  // set the card to the current drawing as a fallback without self deleting
  if (selectedDefinitionIndex !== SENTINEL_CURRENT_DEFINITION_INDEX && definitions[selectedDefinitionIndex] === null) {
    setSelectedDefinitionIndex(SENTINEL_PLACEHOLDER_DEFINITION_INDEX)
    return null
  }

  let initialDefinition
  switch (selectedDefinitionIndex) {
    case SENTINEL_CURRENT_DEFINITION_INDEX:
      // This card is not wrapped in a more specific drawing provider
      // so this takes from the outer most drawing provider
      initialDefinition = {
        definitionIndex: null,
        name: '',
        cuboidValues: structuredClone(cuboidValues),
        rotation: rotation.clone()
      }
      break
    case SENTINEL_PLACEHOLDER_DEFINITION_INDEX:
      initialDefinition = {
        definitionIndex: null,
        name: '',
        cuboidValues: PLACEHOLDER_DRAWING_DEFINITION_CUBOID_VALUES,
        rotation: new Quaternion()
      }
      break
    default: {
      // the drawing should not be null as the index would have set to SENTINEL_CURRENT_DEFINITION_INDEX
      const { definition: { rotation, ...rest } } = definitions[selectedDefinitionIndex]!
      initialDefinition = { rotation: new Quaternion(rotation), ...rest }
      break
    }
  }

  return (
    <DrawingProvider initialDefinition={{ isInteractive: false, ...initialDefinition, ...initialPreference }}>
      <DrawingDefinitionCard
        initialDrawingKind={initialDrawingKind === 'orthographic-editor' ? 'isometric' : initialDrawingKind}
        definitions={definitions}
        deleteCallback={deleteCallback}
        selectedDefinitionIndex={selectedDefinitionIndex}
        setSelectedDefinitionIndex={setSelectedDefinitionIndex}
      />
    </DrawingProvider>
  )
}
