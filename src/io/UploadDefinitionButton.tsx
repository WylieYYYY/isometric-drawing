import type { ButtonHTMLAttributes } from 'react'
import type { DrawingDefinition } from './../drawing/DrawingStore.tsx'
import { Quaternion } from 'quaternion'
import { useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useStore } from './../Store.tsx'

/**
 * Parses the given file as CSV and sets the main viewport to the resulting structure.
 * Do nothing and alert if the file is not of the correct format.
 * @param file - File object provided by a file input that contains a CSV representation.
 * @param storeDefinition - Function to store the given definition into the application store.
 */
async function loadCSV(file: File, storeDefinition: (definition: DrawingDefinition) => void) {
  try {
    const lines = (await file.text()).split('\n')
    if (lines[0] !== 'x,y,z') throw new Error('CSV header is incorrect.')
    lines.shift()

    const cuboidValues = []
    for (const line of lines) {
      // new line appears at the end of the file
      // also allows empty lines that are not at the end
      if (line === '') continue

      const coordinateStrings = line.split(',')
      if (coordinateStrings.length !== 3) throw new Error(`Expected 3 coordinates, got ${coordinateStrings.length}.`)

      const coordinates = {
        x: parseInt(coordinateStrings[0]),
        y: parseInt(coordinateStrings[1]),
        z: parseInt(coordinateStrings[2])
      }

      // check but not actually use the numbers, cuboid values array expects strings
      for (const coordinate of Object.values(coordinates)) {
        if (Number.isNaN(coordinate)) throw new Error(`Expected number as coordinate, got ${coordinate}.`)
      }

      cuboidValues.push({ ...coordinates, dx: 1, dy: 1, dz: 1 })
    }

    const name = prompt('Please enter the name of the drawing:', 'Uploaded Drawing')
    if (name === null) return

    storeDefinition({ definitionIndex: null, name, cuboidValues, rotation: new Quaternion() })
  } catch (error: unknown) {
    alert((error as Error).message + ' Load aborted.')
  }
}

/**
 * Buttons for saving and loading isometric structures in CSV.
 *
 * Screenshot:
 *
 * ![screenshot](screenshots/UploadDefinitionButton.png)
 */
export function UploadDefinitionButton({ ...props }: Exclude<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>) {
  const fileInputRef = useRef<HTMLInputElement|null>(null)

  const [
    newDefinition,
    setDefinition
  ] = useStore(useShallow((state) => [
    state.newDefinition,
    state.setDefinition
  ]))

  function storeDefinition(definition: DrawingDefinition) {
    const definitionIndex = newDefinition('drawing')
    definition.definitionIndex = definitionIndex
    setDefinition(definitionIndex, { definitionKind: 'drawing', definition })
  }

  return (
    <label>
      <button onClick={() => fileInputRef.current!.click()} {...props}>
        Upload CSV
      </button>
      <input
        ref={fileInputRef} type='file' accept='text/csv'
        onChange={(event) => loadCSV(event.target.files![0], storeDefinition)}
        style={{ display: 'none' }}
      />
    </label>
  )
}
