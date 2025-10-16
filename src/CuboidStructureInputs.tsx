import type { PositiveAxis } from './isometric/foreground/IsometricStructure.tsx'
import { useShallow } from 'zustand/react/shallow'
import { useStore } from './Store.tsx'

type CuboidValueComponent = PositiveAxis | 'dx' | 'dy' | 'dz'
export type CuboidValue = { [Property in CuboidValueComponent]: string }

export function CuboidStructureInputs() {
  const [
    cuboidValues,
    newCuboidValue,
    setCuboidValue,
    deleteCuboidValue
  ] = useStore(useShallow((state) => [
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
              newCuboidValue[value] = event.target.value
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
