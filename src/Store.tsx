import type { ReactElement } from 'react'
import type { DrawingDefinition } from './drawing/DrawingStore.tsx'
import type { Coordinates, PositiveAxis } from './drawing/isometric/foreground/IsometricStructure.tsx'
import type { LineType } from './dialog/OrthographicEditorLine.tsx'
import { Quaternion } from 'quaternion'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { ExportCard } from './dialog/ExportCard.tsx'

export type HighlightKind = 'cuboid' | 'face'
export type CubeLocation = { cuboidIndex: number } & Coordinates
export type VisibleCubeFaceLocation = { cubeLocation: CubeLocation, axis: PositiveAxis }
export type OrthographicDrawingDefinition = { drawingIndex: number, name: string, map: Array<Array<LineType>> }
export type TaggedDefinition = { definitionKind: 'drawing', definition: SerializableDrawingDefinition } | { definitionKind: 'orthographic', definition: OrthographicDrawingDefinition }

type DefinitionKind = 'drawing' | 'orthographic'
type SerializableDrawingDefinition = Omit<DrawingDefinition, 'rotation'> & { rotation: { w: number, x: number, y: number, z: number } }

type Store = {
  supportsHover: boolean
  setSupportsHover: (supportsHover: boolean) => void

  highlightKind: HighlightKind
  setHighlightKind: (highlightKind: HighlightKind) => void

  drawings: Array<TaggedDefinition|null>
  newDrawing: (definitionKind: DefinitionKind) => number
  setDrawing: (index: number, definition: TaggedDefinition) => void
  deleteDrawing: (index: number) => void

  exportCards: Array<ReactElement<unknown, typeof ExportCard>>
  newExportCard: () => void
  deleteExportCard: (index: number) => void
}

export function defaultDrawingDefinition(index: number|null = null): DrawingDefinition {
  const DEFAULT_CUBOID_VALUES = [{ x: '0', y: '0', z: '0', dx: '1', dy: '1', dz: '1' }]
  const DEFAULT_ROTATION = new Quaternion()

  return {
    drawingIndex: index,
    name: 'Untitled Drawing',
    cuboidValues: DEFAULT_CUBOID_VALUES,
    rotation: DEFAULT_ROTATION
  }
}

export function defaultOrthographicDrawingDefinition(index: number): OrthographicDrawingDefinition {
  const DEFAULT_MAP: Array<Array<LineType>> = [
    [0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0]
  ]

  return {
    drawingIndex: index,
    name: 'Untitled Drawing',
    map: DEFAULT_MAP
  }
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
export const useStore = create<Store>()(persist(immer((set, get) => ({
  supportsHover: true,

  setSupportsHover: (supportsHover: boolean) => {
    set((state) => {
      state.supportsHover = supportsHover
    })
  },

  highlightKind: 'face',

  setHighlightKind: (highlightKind: HighlightKind) => {
    set((state) => {
      state.highlightKind = highlightKind
    })
  },

  drawings: [],

  newDrawing: (definitionKind: DefinitionKind) => {
    const index = get().drawings.length

    set((state) => {
      switch (definitionKind) {
        case 'drawing':
          state.drawings.push({ definitionKind: 'drawing', definition: defaultDrawingDefinition(index) })
          break
        case 'orthographic':
          state.drawings.push({ definitionKind: 'orthographic', definition: defaultOrthographicDrawingDefinition(index) })
          break
      }
    })

    return index
  },

  setDrawing: (index: number, definition: TaggedDefinition) => {
    set((state) => {
      state.drawings[index] = definition
    })
  },

  deleteDrawing: (index: number) => {
    set((state) => {
      state.drawings[index] = null
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
})), {
  name: 'app-storage',
  storage: createJSONStorage(() => sessionStorage),
  partialize: (state) => ({
    drawings: state.drawings
  })
}))
