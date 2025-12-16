import type { ReactElement } from 'react'
import type { DrawingDefinition } from './drawing/DrawingStore.tsx'
import type { ExportCardProps } from './dialog/ExportCard.tsx'
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
  clearExportCards: () => void
  newExportCard: (props?: Omit<ExportCardProps, 'deleteCallback'>) => void
  deleteExportCard: (index: number) => void
}

/**
 * Creates a default isometric drawing definition, which consists of the default cube.
 * @param index - A definition index, or null if the definition is not yet saved.
 * @returns The default isometric drawing definition.
 */
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

/**
 * Creates a default orthographic drawing definition, which is an empty 3x3 grid.
 * @param index - A valid definition index, since orthographic drawing must be saved before editing.
 * @returns The default orthographic drawing definition.
 */
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

/**
 * Checks if the given attributes match the current highlighting.
 * @param highlightKind - Current highlight kind which determines what attributes to check.
 * @param highlightedTarget - Current highlighted target that is stored.
 * @param cubeLocation - Cuboid index is checked if kind is `cuboid`, coordinates are checked otherwise.
 * @param axis - Additional axis check for face highlighting if non-null.
 * @returns Highlight kind if the given attributes match the current highlighting, null otherwise.
 */
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
  /** Whether the device supports hovering properly. */
  supportsHover: true,

  /**
   * Sets whether the device supports hovering properly.
   * @param supportsHover - The new value.
   */
  setSupportsHover: (supportsHover: boolean) => {
    set((state) => {
      state.supportsHover = supportsHover
    })
  },

  /**
   * Kind of highlighting applied if there is currently any highlighting.
   * Whether anything is highlighted is determined by the drawing store, not here.
   */
  highlightKind: 'face',

  /**
   * Sets the kind of highlighting applied if there is currently any highlighting.
   * @param highlightKind - The new kind.
   */
  setHighlightKind: (highlightKind: HighlightKind) => {
    set((state) => {
      state.highlightKind = highlightKind
    })
  },

  /**
   * The definitions array.
   * Definitions are set to null when deleted rather than removed to preserve indices.
   */
  drawings: [],

  /**
   * Creates a new definition of the given kind at the end of the definitions array.
   * @param definitionKind - Kind of the definition for which the default definition will follow.
   * @returns Index of the new defintion in the definitions array.
   */
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

  /**
   * Sets the definition at the given index to the given definition.
   * @param index - Index of the defintion in the definitions array.
   * @param definition - The new definition.
   */
  setDrawing: (index: number, definition: TaggedDefinition) => {
    set((state) => {
      state.drawings[index] = definition
    })
  },

  /**
   * Deletes a definition at the given index.
   * @param index - Index of the definition in the definitions array.
   */
  deleteDrawing: (index: number) => {
    set((state) => {
      state.drawings[index] = null
    })
  },

  /** Export cards array, each have internal drawing states so the whole components are stored. */
  exportCards: [
    <ExportCard initialDrawingKind='isometric' deleteCallback={() => get().deleteExportCard(0)} />,
    <ExportCard initialDrawingKind='coded-plan' deleteCallback={() => get().deleteExportCard(1)} />,
    <ExportCard initialDrawingKind='orthographic' deleteCallback={() => get().deleteExportCard(2)} />
  ],

  /** Clears all created export cards. */
  clearExportCards: () => {
    set((state) => {
      state.exportCards = []
    })
  },

  /**
   * Creates a new export card at the end of the export cards array.
   * @param props - Props to be passed on to the export card being created.
   */
  newExportCard: (props?: Omit<ExportCardProps, 'deleteCallback'>) => {
    set((state) => {
      const index = state.exportCards.length
      state.exportCards.push(<ExportCard {...props} deleteCallback={() => get().deleteExportCard(index)} />)
    })
  },

  /**
   * Deletes an export card at the given index.
   * @param index - Index of the card in the export cards array.
   */
  deleteExportCard: (index: number) => {
    set((state) => {
      delete state.exportCards[index]
    })
  }
})), {
  name: 'app-storage',
  // move to a more persistent storage once stable
  storage: createJSONStorage(() => sessionStorage),
  partialize: (state) => ({
    drawings: state.drawings
  })
}))
