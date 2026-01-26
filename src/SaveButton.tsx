import type { CuboidValue } from './drawing/control/CuboidStructureInputs.tsx'
import type { DrawingDefinition } from './drawing/DrawingStore.tsx'
import { Quaternion } from 'quaternion'
import { useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { cubeLocationFromCuboidValues, useDrawingStore } from './drawing/DrawingStoreHook.ts'
import { openDownloadPopup } from './export.tsx'
import { rotate } from './util.ts'

type SaveButtonProps = {
  setInitialDefinition: (initialDefinition: DrawingDefinition) => void
  setDownloadUrl: (downloadUrl: string) => void
}

/**
 * Parses the given file as CSV and sets the main viewport to the resulting structure.
 * Do nothing and alert if the file is not of the correct format.
 * @param file - File object provided by a file input that contains a CSV representation.
 * @param setInitialDefinition - Setter for initial definition of the main viewport.
 */
async function loadCSV(file: File, setInitialDefinition: (initialDefinition: DrawingDefinition) => void) {
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

    setInitialDefinition({
      definitionIndex: null,
      name: 'Untitled Drawing',
      cuboidValues,
      rotation: new Quaternion()
    })
  } catch (error: unknown) {
    alert((error as Error).message + ' Load aborted.')
  }
}

/**
 * Opens a download pop-up after converting the cuboid values into CSV.
 * @param cuboidValues - Array of cuboid values to extract coordinates from.
 * @param rotation - Rotation to apply for the resulting CSV.
 * @param setDownloadUrl - Function to set the URL for the download anchor.
 */
function downloadCSV(cuboidValues: Array<CuboidValue>, rotation: Quaternion, setDownloadUrl: (downloadUrl: string) => void) {
  const cubeLocations = rotate(cubeLocationFromCuboidValues(cuboidValues), rotation)

  const content = cubeLocations.reduce((rows, cubeLocation) => {
    const newRow = `${cubeLocation.x},${cubeLocation.y},${cubeLocation.z}`
    return `${rows}${newRow}\n`
  }, 'x,y,z\n')

  openDownloadPopup(new Blob([content], { type: 'text/csv' }), setDownloadUrl, 'structure')
}

/** Buttons for saving and loading isometric structures in CSV. */
export function SaveButton({ setInitialDefinition, setDownloadUrl }: SaveButtonProps) {
  const fileInputRef = useRef<HTMLInputElement|null>(null)

  const [
    cuboidValues,
    rotation
  ] = useDrawingStore(useShallow((state) => [
    state.cuboidValues,
    state.rotation
  ]))

  return (
    <>
      <button onClick={() => downloadCSV(cuboidValues, rotation, setDownloadUrl)}>Save as CSV</button>
      <label>
        <button onClick={() => fileInputRef.current!.click()}>Load from CSV</button>
        <input ref={fileInputRef} type='file' accept='text/csv' onChange={(event) => loadCSV(event.target.files![0], setInitialDefinition)} style={{ display: 'none' }} />
      </label>
    </>
  )
}
