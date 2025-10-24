import { useShallow } from 'zustand/react/shallow'
import { useDrawingStore } from './../DrawingStoreHook.ts'

export function RotationButtons() {
  const [
    resetRotation,
    rotateXClockwise,
    rotateXAnticlockwise,
    rotateYClockwise,
    rotateYAnticlockwise,
    rotateZClockwise,
    rotateZAnticlockwise
  ] = useDrawingStore(useShallow((state) => [
    state.resetRotation,
    state.rotateXClockwise,
    state.rotateXAnticlockwise,
    state.rotateYClockwise,
    state.rotateYAnticlockwise,
    state.rotateZClockwise,
    state.rotateZAnticlockwise
  ]))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(2, 3rem)' }}>
      <button onClick={resetRotation} style={{ gridColumnStart: 2, gridColumnEnd: 4, gridRowStart: 2 }}>Reset rotation</button>
      <button onClick={rotateXClockwise} style={{ gridColumnStart: 4, gridRowStart: 2, backgroundColor: 'red', color: 'white' }}>+X</button>
      <button onClick={rotateXAnticlockwise} style={{ gridColumnStart: 4, gridRowStart: 1, backgroundColor: 'red', color: 'white' }}>-X</button>
      <button onClick={rotateYClockwise} style={{ gridColumnStart: 3, gridRowStart: 1, backgroundColor: 'limegreen', color: 'white' }}>+Y</button>
      <button onClick={rotateYAnticlockwise} style={{ gridColumnStart: 2, gridRowStart: 1, backgroundColor: 'limegreen', color: 'white' }}>-Y</button>
      <button onClick={rotateZClockwise} style={{ gridColumnStart: 1, gridRowStart: 1, backgroundColor: 'blue', color: 'white' }}>+Z</button>
      <button onClick={rotateZAnticlockwise} style={{ gridColumnStart: 1, gridRowStart: 2, backgroundColor: 'blue', color: 'white' }}>-Z</button>
    </div>
  )
}
