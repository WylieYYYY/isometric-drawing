import type { PositiveAxis } from './../isometric/foreground/IsometricStructure.tsx'
import { useShallow } from 'zustand/react/shallow'
import { useDrawingStore } from './../DrawingStoreHook.ts'

/** Cuboid value keys that include sizes alongside coordinates. */
export type CuboidValueComponent = PositiveAxis | 'dx' | 'dy' | 'dz'
/** Cuboid value is an object with valid keys paired with numbers. */
export type CuboidValue = { [Property in CuboidValueComponent]: number }

/**
 * Text input for entering cuboid values manually.
 * If NaN is displayed, fully select the text `NaN` and type a number to continue.
 *
 * Screenshot:
 *
 * ![screenshot](screenshots/CuboidStructureInputs.png)
 */
export function CuboidStructureInputs() {
  const [
    cuboidValues,
    newCuboidValue,
    setCuboidValue,
    deleteCuboidValue
  ] = useDrawingStore(useShallow((state) => [
    state.cuboidValues,
    state.newCuboidValue,
    state.setCuboidValue,
    state.deleteCuboidValue
  ]))

  const inputs = []
  for (const [index, cuboidValue] of cuboidValues.entries()) {
    const cuboidValueComponents: Array<CuboidValueComponent> = ['x', 'y', 'z', 'dx', 'dy', 'dz']
    const subinputs = cuboidValueComponents.map((value) =>
      <>
        <label htmlFor={value}>{value}:</label>
        <input
          name={value}
          value={cuboidValue[value]}
          onChange={
            (event) => {
              const newCuboidValue = { ...cuboidValue }
              newCuboidValue[value] = parseInt(event.target.value)
              setCuboidValue(index, newCuboidValue)
            }
          }
          style={{ width: '2em' }}
        />
      </>
    )
    inputs.push(
      <div>
        {...subinputs}
        <button onClick={() => deleteCuboidValue(index)}>✖</button>
      </div>
    )
  }

  return (
    <>
      {...inputs}
      <button onClick={() => newCuboidValue()}>Add cuboid</button>
    </>
  )
}
