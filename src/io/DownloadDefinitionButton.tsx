import type { Quaternion } from 'quaternion'
import type { ButtonHTMLAttributes } from 'react'
import type { CuboidValue } from './../drawing/control/CuboidStructureInputs.tsx'
import { useShallow } from 'zustand/react/shallow'
import { cubeLocationFromCuboidValues, useDrawingStore } from './../drawing/DrawingStoreHook.ts'
import { openDownloadPopup, rotate } from './../util.ts'

export type DownloadDefinitionButtonProps = {
  /** A download anchor that is used to trigger the pop-up, should be hidden and not be used for other purposes. */
  downloadAnchor: HTMLAnchorElement
}

/**
 * Opens a download pop-up after converting the cuboid values into CSV.
 * @param cuboidValues - Array of cuboid values to extract coordinates from.
 * @param rotation - Rotation to apply for the resulting CSV.
 * @param downloadAnchor - A download anchor that is used to trigger the pop-up, should be hidden and not be used for other purposes.
 */
function downloadCSV(cuboidValues: Array<CuboidValue>, rotation: Quaternion, downloadAnchor: HTMLAnchorElement) {
  const cubeLocations = rotate(cubeLocationFromCuboidValues(cuboidValues), rotation)

  const content = cubeLocations.reduce((rows, cubeLocation) => {
    const newRow = `${cubeLocation.x},${cubeLocation.y},${cubeLocation.z}`
    return `${rows}${newRow}\n`
  }, 'x,y,z\n')

  openDownloadPopup(new Blob([content], { type: 'text/csv' }), downloadAnchor, 'structure')
}

/**
 *Button for downloading the definition as a CSV file.
 *
 * Screenshot:
 *
 * ![screenshot](screenshots/DownloadDefinitionButton.png)
 */
export function DownloadDefinitionButton({
  downloadAnchor, ...props
}: DownloadDefinitionButtonProps & Exclude<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>) {
  const [
    cuboidValues,
    rotation
  ] = useDrawingStore(useShallow((state) => [
    state.cuboidValues,
    state.rotation
  ]))

  return (
    <button onClick={() => downloadCSV(cuboidValues, rotation, downloadAnchor)} {...props}>
      Download as CSV
    </button>
  )
}
