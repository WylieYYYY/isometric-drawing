import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { CodedPlan } from './../CodedPlan.tsx'
import { DrawingProvider } from './../isometric/DrawingStore.tsx'
import { useDrawingStore } from './../isometric/DrawingStoreHook.ts'
import { IsometricViewport } from './../isometric/IsometricViewport.tsx'
import { OrthographicViews } from './../OrthographicViews.tsx'
import { RotationButtons } from './../isometric/control/RotationButtons.tsx'

type DrawingKind = 'isometric' | 'coded-plan' | 'orthographic'

type ExportCardProps = {
  initialDrawingKind?: DrawingKind
}

export function ExportCard({ initialDrawingKind }: ExportCardProps) {
  const [
    cuboidValues,
    rotation
  ] = useDrawingStore(useShallow((state) => [
    state.cuboidValues,
    state.rotation
  ]))

  const [drawingKind, setDrawingKind] = useState<DrawingKind>(initialDrawingKind ?? 'isometric')

  let drawing
  switch (drawingKind) {
    case 'isometric':
      drawing = <IsometricViewport shouldShowGrid={true} shouldShowAxisArrows={true} size={{ width: '100%', height: '100%' }} />
      break
    case 'coded-plan':
      drawing = <CodedPlan />
      break
    case 'orthographic':
      drawing = <OrthographicViews />
      break
  }

  return (
    <DrawingProvider initialDefinition={{ cuboidValues: structuredClone(cuboidValues), rotation: rotation.clone() }}>
      <div>
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
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <RotationButtons />
        </div>
      </div>
    </DrawingProvider>
  )
}
