import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { CodedPlan } from './../CodedPlan.tsx'
import { CodedPlanControls } from './../isometric/control/CodedPlanControls.tsx'
import { DrawingProvider } from './../isometric/DrawingStore.tsx'
import { useDrawingStore } from './../isometric/DrawingStoreHook.ts'
import { IsometricViewport } from './../isometric/IsometricViewport.tsx'
import { OrthographicViews } from './../OrthographicViews.tsx'
import { IsometricControls } from './../isometric/control/IsometricControls.tsx'
import { RotationButtons } from './../isometric/control/RotationButtons.tsx'

type DrawingKind = 'isometric' | 'coded-plan' | 'orthographic'

type ExportCardProps = {
  initialDrawingKind?: DrawingKind
  deleteCallback: () => void
}

export function ExportCard({ initialDrawingKind, deleteCallback }: ExportCardProps) {
  const [
    cuboidValues,
    rotation
  ] = useDrawingStore(useShallow((state) => [
    state.cuboidValues,
    state.rotation
  ]))

  const [drawingKind, setDrawingKind] = useState<DrawingKind>(initialDrawingKind ?? 'isometric')

  let drawing, control
  switch (drawingKind) {
    case 'isometric':
      drawing = <IsometricViewport size={{ width: '100%', height: '100%' }} />
      control = <IsometricControls />
      break
    case 'coded-plan':
      drawing = <CodedPlan />
      control = <CodedPlanControls />
      break
    case 'orthographic':
      drawing = <OrthographicViews />
      control = null
      break
  }

  return (
    <DrawingProvider initialDefinition={{ isInteractive: false, cuboidValues: structuredClone(cuboidValues), rotation: rotation.clone() }}>
      <div style={{ width: 'calc(16rem + 4px)', marginRight: '0.5rem', padding: '0.5rem', border: '2px solid black' }}>
        <div style={{ display: 'flex', justifyContent: 'end' }}>
          <button onClick={deleteCallback}>Delete</button>
        </div>
        <div style={{ width: '16rem', height: '8rem', border: '2px solid black' }}>
          {drawing}
        </div>
        <label>
          Drawing Kind:
          <select value={drawingKind} onChange={event => setDrawingKind(event.target.value as DrawingKind)}>
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
