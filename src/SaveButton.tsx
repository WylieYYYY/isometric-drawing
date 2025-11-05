import type { CubeLocation } from './Store.tsx'
import { cubeLocationFromCuboidValues, useDrawingStore } from './drawing/DrawingStoreHook.ts'

type SaveButtonProps = {
  setDownloadUrl: (downloadUrl: string) => void
}

const BLOB_URL_TIMEOUT = 500

function downloadCSV(setDownloadUrl: (downloadUrl: string) => void, cubeLocations: Array<CubeLocation>) {
  const anchor = document.getElementById('download') as HTMLAnchorElement

  const content = cubeLocations.reduce((rows, cubeLocation) => {
    const newRow = `${cubeLocation.x},${cubeLocation.y},${cubeLocation.z}`
    return `${rows}${newRow}\n`
  }, 'x,y,z\n')

  const blob = new Blob([content], { type: 'text/csv' })
  setDownloadUrl(URL.createObjectURL(blob))
  anchor.download = 'structure.csv'
  setTimeout(() => anchor.click(), BLOB_URL_TIMEOUT)
}

export function SaveButton({ setDownloadUrl }: SaveButtonProps) {
  const cuboidValues = useDrawingStore((state) => state.cuboidValues)
  return <button onClick={() => downloadCSV(setDownloadUrl, cubeLocationFromCuboidValues(cuboidValues))}>Save as CSV</button>
}
