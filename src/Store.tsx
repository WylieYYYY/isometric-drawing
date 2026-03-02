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

/** Kinds of highlighting available. */
export type HighlightKind = 'cuboid' | 'face'
/**
 * Coordinates with the cuboid index so that receivers know where is the cube and which cuboid.
 * The receivers can decide whether to act on the individual cube or the entire cuboid.
 */
export type CubeLocation = {
  /** Index of the value in the cuboid values array. */
  cuboidIndex: number
} & Coordinates
/**
 * Location of the cube and an axis that specifies the face.
 * Can only specify faces that are facing towards the user.
 */
export type VisibleCubeFaceLocation = {
  /** Location of the cube. */
  cubeLocation: CubeLocation
  /** Facing axis. */
  axis: PositiveAxis
}
/** Definition that represents an orthographic drawing that was created with the line editor. */
export type OrthographicDrawingDefinition = {
  /** Index of the definition in the global storage, cannot be null as this type of drawing must always be saved. */
  definitionIndex: number
  /** Name of the definition, no unique constraint since that is enforced by the definition index. */
  name: string
  /**
   * Map of lines forming a grid for drawing, 3 by 3 grid will have array sizes of [3, 4, 3, 4, 3, 4, 3].
   * It means 3 vertical lines, then 4 horizontal lines, then 3 vertical lines and so on.
   */
  map: Array<Array<LineType>>
}
/** Tagged union of definitions. */
export type TaggedDefinition = { definitionKind: 'drawing', definition: SerializableDrawingDefinition } | { definitionKind: 'orthographic', definition: OrthographicDrawingDefinition }

/** Tags for identifying the kinds of definitions. */
type DefinitionKind = 'drawing' | 'orthographic'
/** Drawing definition that is serializable by converting attributes to regular objects. */
type SerializableDrawingDefinition = Omit<DrawingDefinition, 'rotation'> & { rotation: { w: number, x: number, y: number, z: number } }

/** Global states to be shared within the application. */
type Store = {
  /** Whether the device supports hovering properly. */
  supportsHover: boolean
  /**
   * Sets whether the device supports hovering properly.
   * @param supportsHover - The new value.
   */
  setSupportsHover: (supportsHover: boolean) => void

  /**
   * The definitions array.
   * Definitions are set to null when deleted rather than removed to preserve indices.
   */
  definitions: Array<TaggedDefinition|null>
  /**
   * Creates a new definition of the given kind at the end of the definitions array.
   * @param definitionKind - Kind of the definition for which the default definition will follow.
   * @param name - Name to be used for the new definition, a default will be used if not supplied.
   * @returns Index of the new defintion in the definitions array.
   */
  newDefinition: (definitionKind: DefinitionKind, name?: string) => number
  /**
   * Sets the definition at the given index to the given definition.
   * @param index - Index of the defintion in the definitions array.
   * @param definition - The new definition.
   */
  setDefinition: (index: number, definition: TaggedDefinition) => void
  /**
   * Deletes a definition at the given index.
   * @param index - Index of the definition in the definitions array.
   */
  deleteDefinition: (index: number) => void

  /** Export cards array, each have internal drawing states so the whole components are stored. */
  exportCards: Array<ReactElement<unknown, typeof ExportCard>>
  /** Clears all created export cards. */
  clearExportCards: () => void
  /**
   * Creates a new export card at the end of the export cards array.
   * @param props - Props to be passed on to the export card being created.
   */
  newExportCard: (props?: Omit<ExportCardProps, 'deleteCallback'>) => void
  /**
   * Deletes an export card at the given index.
   * @param index - Index of the card in the export cards array.
   */
  deleteExportCard: (index: number) => void
}

/**
 * Creates a default isometric drawing definition, which consists of the default cube.
 * @param index - A definition index, or null if the definition is not yet saved.
 * @returns The default isometric drawing definition.
 */
export function defaultDrawingDefinition(index: number|null = null): DrawingDefinition {
  const DEFAULT_CUBOID_VALUES = [{ x: 0, y: 0, z: 0, dx: 1, dy: 1, dz: 1 }]
  const DEFAULT_ROTATION = new Quaternion()

  return {
    definitionIndex: index,
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
    definitionIndex: index,
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

/** Uses storage for global states to be shared within the application. */
export const useStore = create<Store>()(persist(immer((set, get) => ({
  supportsHover: true,

  setSupportsHover: (supportsHover: boolean) => {
    set((state) => {
      state.supportsHover = supportsHover
    })
  },

  definitions: [],

  newDefinition: (definitionKind: DefinitionKind, name?: string) => {
    const index = get().definitions.length

    set((state) => {
      switch (definitionKind) {
        case 'drawing': {
          const drawingDefinition = defaultDrawingDefinition(index)
          if (name !== undefined) drawingDefinition.name = name
          state.definitions.push({ definitionKind: 'drawing', definition: drawingDefinition })
          break
        }
        case 'orthographic': {
          const orthographicDrawingDefinition = defaultOrthographicDrawingDefinition(index)
          if (name !== undefined) orthographicDrawingDefinition.name = name
          state.definitions.push({ definitionKind: 'orthographic', definition: orthographicDrawingDefinition })
          break
        }
      }
    })

    return index
  },

  setDefinition: (index: number, definition: TaggedDefinition) => {
    set((state) => {
      state.definitions[index] = definition
    })
  },

  deleteDefinition: (index: number) => {
    set((state) => {
      state.definitions[index] = null
    })
  },

  exportCards: [
    <ExportCard initialDrawingKind='isometric' deleteCallback={() => get().deleteExportCard(0)} />,
    <ExportCard initialDrawingKind='coded-plan' deleteCallback={() => get().deleteExportCard(1)} />,
    <ExportCard initialDrawingKind='orthographic' deleteCallback={() => get().deleteExportCard(2)} />
  ],

  clearExportCards: () => {
    set((state) => {
      state.exportCards = []
    })
  },

  newExportCard: (props?: Omit<ExportCardProps, 'deleteCallback'>) => {
    set((state) => {
      const index = state.exportCards.length
      state.exportCards.push(<ExportCard {...props} deleteCallback={() => get().deleteExportCard(index)} />)
    })
  },

  deleteExportCard: (index: number) => {
    set((state) => {
      delete state.exportCards[index]
    })
  }
})), {
  name: 'app-storage',
  // move to a more persistent storage once stable
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    definitions: state.definitions
  })
}))
