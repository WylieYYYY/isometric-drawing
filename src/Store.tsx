import type { ReactElement } from 'react'
import type { Coordinates, PositiveAxis } from './drawing/isometric/foreground/IsometricStructure.tsx'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { ExportCard } from './dialog/ExportCard.tsx'

export type HighlightKind = 'cuboid' | 'face'
export type CubeLocation = { cuboidIndex: number } & Coordinates
export type VisibleCubeFaceLocation = { cubeLocation: CubeLocation, axis: PositiveAxis }

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
