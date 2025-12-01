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
import { OrthographicViews } from './../drawing/auxiliary/OrthographicViews.tsx'
import { RotationButtons } from './../drawing/control/RotationButtons.tsx'
import { useStore } from './../Store.tsx'

type DrawingKind = 'isometric' | 'coded-plan' | 'orthographic'

type ExportCardProps = {
  initialDrawingKind?: DrawingKind
  deleteCallback: () => void
}

export function ExportCard({ initialDrawingKind, deleteCallback }: ExportCardProps) {
  const drawings = useStore((state) => state.drawings)

  const [
    cuboidValues,
    rotation
  ] = useDrawingStore(useShallow((state) => [
    state.cuboidValues,
    state.rotation
  ]))

  const [selectedDrawingIndex, setSelectedDrawingIndex] = useState<number|'current'>('current')
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

  let initialDefinition
  if (selectedDrawingIndex === 'current') {
    initialDefinition = {
      drawingIndex: null,
      name: '',
      cuboidValues: structuredClone(cuboidValues),
      rotation: rotation.clone()
    }
  } else {
    const { rotation, ...rest } = drawings[selectedDrawingIndex]!
    initialDefinition = { rotation: new Quaternion(rotation), ...rest }
  }

  return (
    <DrawingProvider initialDefinition={{ isInteractive: false, ...initialDefinition }}>
      <div style={{ width: 'calc(16rem + 4px)', marginRight: '0.5rem', padding: '0.5rem', border: '2px solid black' }}>
        <div style={{ display: 'flex', justifyContent: 'end' }}>
          <button onClick={deleteCallback}>Delete</button>
        </div>
        <div style={{ width: '16rem', height: '8rem', border: '2px solid black' }}>
          {drawing}
        </div>
        <label style={{ display: 'block' }}>
          Drawing:
          <select value={selectedDrawingIndex} onChange={(event) => setSelectedDrawingIndex(event.target.value === 'current' ? 'current' : parseInt(event.target.value))}>
            <option value='current'>[Current Drawing]</option>
            {...drawings.filter((drawing) => drawing !== null).map((drawing) => <option value={drawing.drawingIndex!.toString()}>{drawing.name}</option>)}
          </select>
        </label>
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
      </div>
    </DrawingProvider>
  )
}
