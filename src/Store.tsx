import type { ReactElement } from 'react'
import type { CuboidValue } from './CuboidStructureInputs.tsx'
import type { Coordinates, PositiveAxis } from './isometric/foreground/IsometricStructure.tsx'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { ExportCard } from './dialog/ExportCard.tsx'

export type HighlightKind = 'cuboid' | 'face'
export type CubeLocation = { cuboidIndex: number } & Coordinates
export type VisibleCubeFaceLocation = { cubeLocation: CubeLocation, axis: PositiveAxis }

type CuboidNumberValue = { [Property in keyof CuboidValue]: number }

type Store = {
  highlightKind: HighlightKind
  setHighlightKind: (highlightKind: HighlightKind) => void

  exportCards: Array<ReactElement<unknown, typeof ExportCard>>
  newExportCard: () => void
  deleteExportCard: (index: number) => void
}

export function isCubeFaceHighlighted(
  highlightKind: HighlightKind,
  highlightedTarget: VisibleCubeFaceLocation|null,
  cubeLocation: CubeLocation,
  axis: PositiveAxis|null
): HighlightKind|null {
  if (highlightedTarget === null) return null

  if (highlightKind === 'cuboid') {
    if (cubeLocation.cuboidIndex === highlightedTarget.cubeLocation.cuboidIndex) return 'cuboid'
    return null
  }

  const faceHighlighted = cubeLocation.x === highlightedTarget.cubeLocation.x &&
      cubeLocation.y === highlightedTarget.cubeLocation.y &&
      cubeLocation.z === highlightedTarget.cubeLocation.z &&
      (axis === null || axis === highlightedTarget.axis)

  if (faceHighlighted) return 'face'
  return null
}

/**
 * Extracts an array of individual cube location by iterating over possible coordinates of cuboid values.
 * @param cuboidValues - Array of cuboid values to extract coordinates from.
 * @returns The cube locations.
 */
export function cubeLocationFromCuboidValues(cuboidValues: Array<CuboidValue>): Array<CubeLocation> {
  const cubeLocations = []

  for (const [cuboidIndex, cuboidValue] of cuboidValues.entries()) {
    const parsedCuboidValue: Record<string, number> = {}
    for (const [key, value] of Object.entries(cuboidValue)) parsedCuboidValue[key] = parseInt(value)
    if (Object.values(parsedCuboidValue).some(isNaN)) continue

    const { x, y, z, dx, dy, dz } = parsedCuboidValue as CuboidNumberValue

    for (let currentDx = 0; currentDx !== dx; currentDx += Math.sign(dx)) {
      for (let currentDy = 0; currentDy !== dy; currentDy += Math.sign(dy)) {
        for (let currentDz = 0; currentDz !== dz; currentDz += Math.sign(dz)) {
          cubeLocations.push({ cuboidIndex, x: x + currentDx, y: y + currentDy, z: z + currentDz })
        }
      }
    }
  }

  return cubeLocations
}

/** Uses storage for global states to be shared by components. */
export const useStore = create<Store>()(immer((set, get) => ({
  highlightKind: 'face',

  setHighlightKind: (highlightKind: HighlightKind) => {
    set((state) => {
      state.highlightKind = highlightKind
    })
  },

  exportCards: [
    <ExportCard initialDrawingKind='isometric' deleteCallback={() => get().deleteExportCard(0)} />,
    <ExportCard initialDrawingKind='coded-plan' deleteCallback={() => get().deleteExportCard(1)} />,
    <ExportCard initialDrawingKind='orthographic' deleteCallback={() => get().deleteExportCard(2)} />
  ],

  newExportCard: () => {
    set((state) => {
      const index = state.exportCards.length
      state.exportCards.push(<ExportCard deleteCallback={() => get().deleteExportCard(index)} />)
    })
  },

  deleteExportCard: (index: number) => {
    set((state) => {
      delete state.exportCards[index]
    })
  }
})))
