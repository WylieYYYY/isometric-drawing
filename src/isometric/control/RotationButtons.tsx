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
    <>
      <button onClick={resetRotation}>Reset rotation</button>
      <button onClick={rotateXClockwise}>Rotate about positive x (→x)</button>
      <button onClick={rotateXAnticlockwise}>Rotate about negative x (←x)</button>
      <button onClick={rotateYClockwise}>Rotate about positive y (→y)</button>
      <button onClick={rotateYAnticlockwise}>Rotate about negative y (←y)</button>
      <button onClick={rotateZClockwise}>Rotate about positive z (→z)</button>
      <button onClick={rotateZAnticlockwise}>Rotate about negative z (←z)</button>
    </>
  )
}
