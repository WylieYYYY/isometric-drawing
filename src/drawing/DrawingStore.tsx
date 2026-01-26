import type { PropsWithChildren } from 'react'
import type { StoreApi } from 'zustand'
import type { CuboidValue } from './control/CuboidStructureInputs.tsx'
import type { PositiveAxis } from './isometric/foreground/IsometricStructure.tsx'
import type { CubeLocation, HighlightKind, VisibleCubeFaceLocation } from './../Store.tsx'
import { Quaternion } from 'quaternion'
import { useEffect, useRef } from 'react'
import { createStore, useStore } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { useShallow } from 'zustand/react/shallow'
import { cubeLocationFromCuboidValues, DrawingContext } from './DrawingStoreHook.ts'
import { defaultDrawingDefinition, isCubeFaceHighlighted } from './../Store.tsx'
import { rotate } from './../util.ts'

/** Persistent attributes that defines a drawing. */
export type DrawingDefinition = {
  /** Index of the current definition in the global storage, null if the current definition is not saved at all. */
  definitionIndex: number|null
  /** Name of the drawing, no unique constraint since that is enforced by the definition index. */
  name: string
  /** Cuboid values array, holds cuboids of one isometric structure. */
  cuboidValues: Array<CuboidValue>
  /** Quaternion to preserve non-commutative rotations compactly. */
  rotation: Quaternion
}

/** Persistent preference that is specified manually by the user. */
export type DrawingPreference = {
  /**
   * Whether the isometric viewport is cropped to fit the axes and structure tightly.
   * To override the cropping behavior, one of the following can be done:
   *  - Set this as false and set `canHaveUndefinedSize` to true to have the size unset. (used for uncropped export)
   *  - Set `size` parameter fully. (used for main viewport)
   */
  shouldCropIsometricViewport: boolean
  /** Whether the background grid is shown on the isometric drawing. */
  shouldShowIsometricGrid: boolean
  /** Whether the background axis arrows are shown on the isometric drawing. */
  shouldShowAxisArrows: boolean
  /** Whether the foreground structure is shown on the isometric drawing. */
  shouldShowIsometricStructure: boolean
  /** Whether the numbers are shown on the coded plan. */
  shouldShowCodedPlanNumbers: boolean
  /**
   * Sets whether the orthographic views should be split into three images.
   * The images are not laid out so they can only be used for export purpose.
   */
  shouldSplitOrthographicViewsAsThree: boolean
  /** Whether the background grid is shown on the orthographic views. */
  shouldShowOrthographicViewsGrid: boolean
  /** Whether the foreground structure is shown on the orthographic views. */
  shouldShowOrthographicStructure: boolean
}

/**
 * Store that manages states belonging to a structure.
 * If components share the same store, then they refer to the same structure.
 * Defining attributes for drawings are in `DrawingDefinition`.
 * Persistent preference attributes that are stored as a part of preset are in `DrawingPreference`.
 */
export type DrawingStore = DrawingDefinition & DrawingPreference & {
  /**
   * Flag to indicate whether attributes that are in the definition has changed.
   * This will be set to zero when `setDefinitionIndex`, which is when a drawing is loaded or saved.
   */
  hasDefinitionChanged: boolean,

  /**
   * Sets the index of the current drawing in the global storage, null if the current drawing is not saved at all.
   * This will reset `hasDefinitionChanged` to false since this is called when a drawing is loaded or saved.
   * @param definitionIndex - The new drawing index.
   */
  setDefinitionIndex: (definitionIndex: number|null) => void

  /**
   * Sets the name of the drawing.
   * @param name - The new name.
   */
  setName: (name: string) => void

  /**
   * Whether to generate interactive faces in the isometric drawing.
   * Exported SVG can avoid large file size due to transparent triangles by setting this to false.
   */
  isInteractive: boolean

  /**
   * Set whether the isometric viewport is cropped to fit the axes and structure tightly.
   * @param shouldCropIsometricViewport - The new value.
   */
  setShouldCropIsometricViewport: (shouldCropIsometricViewport: boolean) => void
  /**
   * Sets whether the background grid is shown on the isometric drawing.
   * @param shouldShowIsometricGrid - The new value.
   */
  setshouldShowIsometricGrid: (shouldShowIsometricGrid: boolean) => void
  /**
   * Sets whether the background axis arrows are shown on the isometric drawing.
   * @param shouldShowAxisArrows - The new value.
   */
  setShouldShowAxisArrows: (shouldShowAxisArrows: boolean) => void
  /**
   * Sets whether the foreground structure is shown on the isometric drawing.
   * @param shouldShowIsometricStructure - The new value.
   */
  setshouldShowIsometricStructure: (shouldShowIsometricStructure: boolean) => void
  /**
   * Sets whether the numbers are shown on the coded plan.
   * @param shouldShowCodedPlanNumbers - The new value.
   */
  setShouldShowCodedPlanNumbers: (shouldShowCodedPlanNumbers: boolean) => void
  /**
   * Sets whether the orthographic views should be split into three images.
   * @param shouldSplitOrthographicViewsAsThree - The new value.
   */
  setShouldSplitOrthographicViewsAsThree: (shouldSplitOrthographicViewsAsThree: boolean) => void
  /**
   * Sets whether the background grid is shown on the orthographic views.
   * @param shouldShowOrthographicViewsGrid - The new value.
   */
  setShouldShowOrthographicViewsGrid: (shouldShowOrthographicViewsGrid: boolean) => void
  /**
   * Sets whether the foreground structure is shown on the orthographic views.
   * @param shouldShowOrthographicStructure - The new value.
   */
  setShouldShowOrthographicStructure: (shouldShowOrthographicStructure: boolean) => void

  /**
   * Detail required for every highlight kinds to allow switching between them,
   * null for no current highlight.
   */
  highlightedTarget: VisibleCubeFaceLocation|null
  /**
   * Request highlight for a face, highlight kind determines the final highlight area.
   * @param cubeLocation - The cube location.
   * @param axis - Positive axis which the face is facing towards.
   */
  highlightCubeFace: (cubeLocation: CubeLocation, axis: PositiveAxis) => void
  /**
   * Unhighlights if the `isCubeFaceHighlighted` function determines
   * that the given attributes match the current highlighting.
   * This is to prevent stale request if the highlight changes before the request is received.
   * @param highlightKind - Only unhighlights if the specified highlight kind is in effect.
   * @param cubeLocation - The cube location, used for attributes matching.
   */
  unhighlightCubeFace: (highlightKind: HighlightKind, cubeLocation: CubeLocation) => void

  /**
   * Sets all cuboid values wholesale, use this in provider and prefer other functions in other components.
   * @param cuboidValues - The new values to take.
   */
  setCuboidValues: (cuboidValues: Array<CuboidValue>) => void
  /**
   * Creates a new cuboid value at the end of the cuboid values array.
   * @param cuboidValue - A specific value to initialize with, default is a unit cube at origin.
   */
  newCuboidValue: (cuboidValue?: CuboidValue) => void
  /**
   * Sets the cuboid value at the given index to the given value.
   * @param index - Index of the value in the cuboid values array.
   * @param cuboidValue - The new value.
   */
  setCuboidValue: (index: number, cuboidValue: CuboidValue) => void

  /**
   * Deletes a cuboid value at the given index.
   * @param index - Index of the value in the cuboid values array.
   */
  deleteCuboidValue: (index: number) => void

  /** Resets the rotation such that the rendering coordinates matches the ones denoted in the cuboid values. */
  resetRotation: () => void

  /** Rotates 90 degrees clockwise around x-axis (positive x), origin perspective. */
  rotateXClockwise: () => void
  /** Rotates 90 degrees anticlockwise around x-axis (negative x), origin perspective. */
  rotateXAnticlockwise: () => void

  /** Rotates 90 degrees clockwise around y-axis (positive y), origin perspective. */
  rotateYClockwise: () => void
  /** Rotates 90 degrees anticlockwise around y-axis (negative y), origin perspective. */
  rotateYAnticlockwise: () => void

  /** Rotates 90 degrees clockwise around z-axis (positive z), origin perspective. */
  rotateZClockwise: () => void
  /** Rotates 90 degrees anticlockwise around z-axis (negative z), origin perspective. */
  rotateZAnticlockwise: () => void
}

/**
 * Persistent preference that is specified manually by the user and a interactive flag.
 * The interactive flag resides here as it is set by the application, not the user.
 */
export type InitialPreference = Partial<DrawingPreference> & {
  /** Whether new cubes can be placed on the isometric drawing. */
  isInteractive?: boolean
}
/**
 * All attributes that are used to populate the store initially.
 * Consists of all store attributes that are not ephemeral interation states.
 * All attributes are optional.
 */
export type InitialDefinition = Partial<DrawingDefinition> & InitialPreference

/**
 * Creates a new instance of the drawing store, overriding the defaults if needed.
 * @param initialPreference - Preference to be populated initially.
 * @returns The created drawing store.
 */
const createDrawingStore = (initialPreference: InitialPreference) => createStore<DrawingStore>()(immer((set, get) => ({ ...{
  hasDefinitionChanged: false,

  definitionIndex: null,

  setDefinitionIndex: (definitionIndex: number|null) => {
    set((state) => {
      state.definitionIndex = definitionIndex
      state.hasDefinitionChanged = definitionIndex === null
    })
  },

  name: 'Untitled Drawing',

  setName: (name: string) => {
    set((state) => {
      state.name = name
      state.hasDefinitionChanged = true
    })
  },

  isInteractive: true,

  shouldCropIsometricViewport: true,

  setShouldCropIsometricViewport: (shouldCropIsometricViewport: boolean) => {
    set((state) => {
      state.shouldCropIsometricViewport = shouldCropIsometricViewport
    })
  },

  shouldShowIsometricGrid: true,

  setshouldShowIsometricGrid: (shouldShowIsometricGrid: boolean) => {
    set((state) => {
      state.shouldShowIsometricGrid = shouldShowIsometricGrid
    })
  },

  shouldShowAxisArrows: true,

  setShouldShowAxisArrows: (shouldShowAxisArrows: boolean) => {
    set((state) => {
      state.shouldShowAxisArrows = shouldShowAxisArrows
    })
  },

  shouldShowIsometricStructure: true,

  setshouldShowIsometricStructure: (shouldShowIsometricStructure: boolean) => {
    set((state) => {
      state.shouldShowIsometricStructure = shouldShowIsometricStructure
    })
  },

  shouldShowCodedPlanNumbers: true,

  setShouldShowCodedPlanNumbers: (shouldShowCodedPlanNumbers: boolean) => {
    set((state) => {
      state.shouldShowCodedPlanNumbers = shouldShowCodedPlanNumbers
    })
  },

  shouldSplitOrthographicViewsAsThree: false,

  setShouldSplitOrthographicViewsAsThree: (shouldSplitOrthographicViewsAsThree: boolean) => {
    set((state) => {
      state.shouldSplitOrthographicViewsAsThree = shouldSplitOrthographicViewsAsThree
    })
  },

  shouldShowOrthographicViewsGrid: true,

  setShouldShowOrthographicViewsGrid: (shouldShowOrthographicViewsGrid: boolean) => {
    set((state) => {
      state.shouldShowOrthographicViewsGrid = shouldShowOrthographicViewsGrid
    })
  },

  shouldShowOrthographicStructure: true,

  setShouldShowOrthographicStructure: (shouldShowOrthographicStructure: boolean) => {
    set((state) => {
      state.shouldShowOrthographicStructure = shouldShowOrthographicStructure
    })
  },

  highlightedTarget: null,

  highlightCubeFace: (cubeLocation: CubeLocation, axis: PositiveAxis) => {
    set((state) => {
      state.highlightedTarget = { cubeLocation, axis }
    })
  },

  unhighlightCubeFace: (highlightKind: HighlightKind, cubeLocation: CubeLocation) => {
    if (isCubeFaceHighlighted(highlightKind, get().highlightedTarget, cubeLocation, null) !== null) {
      set((state) => { state.highlightedTarget = null })
    }
  },

  cuboidValues: [
    { x: 0, y: 0, z: 0, dx: 1, dy: 1, dz: 1 }
  ],

  setCuboidValues: (cuboidValues: Array<CuboidValue>) => {
    set((state) => {
      state.cuboidValues = cuboidValues
    })
  },

  newCuboidValue: (cuboidValue: CuboidValue = { x: 0, y: 0, z: 0, dx: 1, dy: 1, dz: 1 }) => {
    set((state) => {
      state.cuboidValues.push(cuboidValue)
      state.hasDefinitionChanged = true
    })
  },

  setCuboidValue: (index: number, cuboidValue: CuboidValue) => {
    set((state) => {
      state.cuboidValues[index] = cuboidValue
      state.hasDefinitionChanged = true
    })
  },

  deleteCuboidValue: (index: number) => {
    set((state) => {
      state.cuboidValues.splice(index, 1)
      state.hasDefinitionChanged = true
    })
  },

  rotation: new Quaternion(),

  resetRotation: () => {
    set((state) => {
      state.rotation = new Quaternion()
      state.hasDefinitionChanged = true
    })
  },

  rotateXClockwise: () => {
    set((state) => {
      state.rotation = Quaternion.fromAxisAngle([1, 0, 0], Math.PI / 2).mul(state.rotation)
      state.hasDefinitionChanged = true
    })
  },

  rotateXAnticlockwise: () => {
    set((state) => {
      state.rotation = Quaternion.fromAxisAngle([1, 0, 0], -Math.PI / 2).mul(state.rotation)
      state.hasDefinitionChanged = true
    })
  },

  rotateYClockwise: () => {
    set((state) => {
      state.rotation = Quaternion.fromAxisAngle([0, 1, 0], Math.PI / 2).mul(state.rotation)
      state.hasDefinitionChanged = true
    })
  },

  rotateYAnticlockwise: () => {
    set((state) => {
      state.rotation = Quaternion.fromAxisAngle([0, 1, 0], -Math.PI / 2).mul(state.rotation)
      state.hasDefinitionChanged = true
    })
  },

  rotateZClockwise: () => {
    set((state) => {
      state.rotation = Quaternion.fromAxisAngle([0, 0, 1], Math.PI / 2).mul(state.rotation)
      state.hasDefinitionChanged = true
    })
  },

  rotateZAnticlockwise: () => {
    set((state) => {
      state.rotation = Quaternion.fromAxisAngle([0, 0, 1], -Math.PI / 2).mul(state.rotation)
      state.hasDefinitionChanged = true
    })
  }
}, ...initialPreference })))

/**
 * Provider that injects context value (the drawing store) for children that are using the drawing store.
 * It is an error to use components that relies on the drawing store without a provider parent.
 * Default attribute values will be used for missing attributes in the given definition.
 * If no definition is given, all attributes will be set to the default values.
 */
export function DrawingProvider({ initialDefinition, children }: PropsWithChildren<{ initialDefinition?: InitialDefinition }>) {
  const storeRef = useRef<StoreApi<DrawingStore>|null>(null)

  const { definitionIndex, name, cuboidValues, rotation, ...rest } = { ...defaultDrawingDefinition(), ...initialDefinition }

  // preference is not externally changeable after the first value
  // set it in the effect below if changing preference dynamically is required
  if (storeRef.current === null) storeRef.current = createDrawingStore(rest)

  const [
    setDefinitionIndex,
    setName,
    setCuboidValues
  ] = useStore(storeRef.current, useShallow((state) => [
    state.setDefinitionIndex,
    state.setName,
    state.setCuboidValues
  ]))

  // detects external change to the definition and synchronize the store with it
  useEffect(() => {
    if (initialDefinition !== undefined) {
      setName(name)

      // pre-apply rotation so that the rotation for a provider is separate from the initial definition
      // removing cuboid support removes the need for marshalling
      const cubeLocations = cubeLocationFromCuboidValues(cuboidValues)
      const rotatedCuboidValues = rotate(cubeLocations, rotation)
          .map(({ x, y, z }) => ({ x, y, z, dx: 1, dy: 1, dz: 1 }))
      setCuboidValues(rotatedCuboidValues)

      // setting the drawing index must be last as this defines whether
      // a drawing definition has changed from the initial definition
      setDefinitionIndex(definitionIndex)
    }
  }, [cuboidValues, definitionIndex, initialDefinition, name, rotation, setCuboidValues, setDefinitionIndex, setName])

  return (
    <DrawingContext.Provider value={storeRef.current}>
      {children}
    </DrawingContext.Provider>
  )
}
