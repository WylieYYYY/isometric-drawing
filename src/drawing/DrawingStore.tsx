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
import { isCubeFaceHighlighted } from './../Store.tsx'
import { rotate } from './../util.ts'

export type DrawingDefinition = {
  drawingIndex: number|null
  name: string
  cuboidValues: Array<CuboidValue>
  rotation: Quaternion
}

export type DrawingPreference = {
  shouldCropIsometricViewport: boolean
  shouldShowIsometricGrid: boolean
  shouldShowAxisArrows: boolean
  shouldShowIsometricStructure: boolean
  shouldShowCodedPlanNumbers: boolean
  shouldSplitOrthographicViewsAsThree: boolean
  shouldShowOrthographicViewsGrid: boolean
  shouldShowOrthographicStructure: boolean
}

export type DrawingStore = DrawingDefinition & DrawingPreference & {
  hasDefinitionChanged: boolean,

  setDrawingIndex: (drawingIndex: number|null) => void

  setName: (name: string) => void

  isInteractive: boolean

  setShouldCropIsometricViewport: (shouldCropIsometricViewport: boolean) => void
  setshouldShowIsometricGrid: (shouldShowIsometricGrid: boolean) => void
  setShouldShowAxisArrows: (shouldShowAxisArrows: boolean) => void
  setshouldShowIsometricStructure: (shouldShowIsometricStructure: boolean) => void
  setShouldShowCodedPlanNumbers: (shouldShowCodedPlanNumbers: boolean) => void
  setShouldSplitOrthographicViewsAsThree: (shouldSplitOrthographicViewsAsThree: boolean) => void
  setShouldShowOrthographicViewsGrid: (shouldShowOrthographicViewsGrid: boolean) => void
  setShouldShowOrthographicStructure: (shouldShowOrthographicStructure: boolean) => void

  highlightedTarget: VisibleCubeFaceLocation|null
  highlightCubeFace: (cubeLocation: CubeLocation, axis: PositiveAxis) => void
  unhighlightCubeFace: (highlightKind: HighlightKind, cubeLocation: CubeLocation) => void

  setCuboidValues: (cuboidValues: Array<CuboidValue>) => void
  newCuboidValue: (cuboidValue?: CuboidValue) => void
  setCuboidValue: (index: number, cuboidValue: CuboidValue) => void
  deleteCuboidValue: (index: number) => void

  resetRotation: () => void

  rotateXClockwise: () => void
  rotateXAnticlockwise: () => void

  rotateYClockwise: () => void
  rotateYAnticlockwise: () => void

  rotateZClockwise: () => void
  rotateZAnticlockwise: () => void
}

type InitialPreference = Partial<DrawingPreference> & { isInteractive?: boolean }
type InitialDefinition = DrawingDefinition & InitialPreference

/**
 * Calibrates a quaternion rotation such that it does not drift from 90 degree angles
 * after multiple rotations, causing iterated rotation to not work.
 * @param rotation - Rotation to be calibrated.
 * @returns The calibrated rotation.
 */
function calibrateRotation(rotation: Quaternion): Quaternion {
  const [phiRotationAngle, thetaRotationAngle, psiRotationAngle] = rotation.toEuler()
  const ZRotationCount = Math.round(phiRotationAngle / (Math.PI / 2))
  const XRotationCount = Math.round(thetaRotationAngle / (Math.PI / 2))
  const YRotationCount = Math.round(psiRotationAngle / (Math.PI / 2))
  return Quaternion.fromEuler(
    ZRotationCount * (Math.PI / 2),
    XRotationCount * (Math.PI / 2),
    YRotationCount * (Math.PI / 2)
  )
}

/**
 * Creates a new instance of the drawing store, overriding the defaults if needed.
 * @param initialPreference - Preference to be populated initially.
 * @returns The created drawing store.
 */
const createDrawingStore = (initialPreference: InitialPreference) => createStore<DrawingStore>()(immer((set, get) => ({ ...{
  /**
   * Flag to indicate whether attributes that are in the definition has changed.
   * This will be set to zero when `setDrawingIndex`, which is when a drawing is loaded or saved.
   */
  hasDefinitionChanged: false,

  /** Index of the current drawing in the global storage, null if the current drawing is not saved at all. */
  drawingIndex: null,

  /**
   * Sets the index of the current drawing in the global storage, null if the current drawing is not saved at all.
   * This will reset `hasDefinitionChanged` to false since this is called when a drawing is loaded or saved.
   * @param drawingIndex - The new drawing index.
   */
  setDrawingIndex: (drawingIndex: number|null) => {
    set((state) => {
      state.drawingIndex = drawingIndex
      state.hasDefinitionChanged = drawingIndex === null
    })
  },

  /** Name of the drawing, no unique constraint since that is enforced by the drawing index. */
  name: 'Untitled Drawing',

  /**
   * Sets the name of the drawing.
   * @param name - The new name.
   */
  setName: (name: string) => {
    set((state) => {
      state.name = name
      state.hasDefinitionChanged = true
    })
  },

  /**
   * Whether to generate interactive faces in the isometric drawing.
   * Exported SVG can avoid large file size due to transparent triangles by setting this to false.
   */
  isInteractive: true,

  /**
   * Whether the isometric viewport is cropped to fit the axes and structure tightly.
   * To override the cropping behavior, one of the following can be done:
   *  - Set this as false and set `canHaveUndefinedSize` to true to have the size unset. (used for uncropped export)
   *  - Set `size` parameter fully. (used for main viewport)
   */
  shouldCropIsometricViewport: true,

  /**
   * Set whether the isometric viewport is cropped to fit the axes and structure tightly.
   * @param shouldCropIsometricViewport - The new value.
   */
  setShouldCropIsometricViewport: (shouldCropIsometricViewport: boolean) => {
    set((state) => {
      state.shouldCropIsometricViewport = shouldCropIsometricViewport
    })
  },

  /** Whether the background grid is shown on the isometric drawing. */
  shouldShowIsometricGrid: true,

  /**
   * Sets whether the background grid is shown on the isometric drawing.
   * @param shouldShowIsometricGrid - The new value.
   */
  setshouldShowIsometricGrid: (shouldShowIsometricGrid: boolean) => {
    set((state) => {
      state.shouldShowIsometricGrid = shouldShowIsometricGrid
    })
  },

  /** Whether the background axis arrows are shown on the isometric drawing. */
  shouldShowAxisArrows: true,

  /**
   * Sets whether the background axis arrows are shown on the isometric drawing.
   * @param shouldShowAxisArrows - The new value.
   */
  setShouldShowAxisArrows: (shouldShowAxisArrows: boolean) => {
    set((state) => {
      state.shouldShowAxisArrows = shouldShowAxisArrows
    })
  },

  /** Whether the foreground structure is shown on the isometric drawing. */
  shouldShowIsometricStructure: true,

  /**
   * Sets whether the foreground structure is shown on the isometric drawing.
   * @param shouldShowIsometricStructure - The new value.
   */
  setshouldShowIsometricStructure: (shouldShowIsometricStructure: boolean) => {
    set((state) => {
      state.shouldShowIsometricStructure = shouldShowIsometricStructure
    })
  },

  /** Whether the numbers are shown on the coded plan. */
  shouldShowCodedPlanNumbers: true,

  /**
   * Sets whether the numbers are shown on the coded plan.
   * @param shouldShowCodedPlanNumbers - The new value.
   */
  setShouldShowCodedPlanNumbers: (shouldShowCodedPlanNumbers: boolean) => {
    set((state) => {
      state.shouldShowCodedPlanNumbers = shouldShowCodedPlanNumbers
    })
  },

  /**
   * Sets whether the orthographic views should be split into three images.
   * The images are not laid out so they can only be used for export purpose.
   */
  shouldSplitOrthographicViewsAsThree: false,

  /**
   * Sets whether the orthographic views should be split into three images.
   * @param shouldSplitOrthographicViewsAsThree - The new value.
   */
  setShouldSplitOrthographicViewsAsThree: (shouldSplitOrthographicViewsAsThree: boolean) => {
    set((state) => {
      state.shouldSplitOrthographicViewsAsThree = shouldSplitOrthographicViewsAsThree
    })
  },

  /** Whether the background grid is shown on the orthographic views. */
  shouldShowOrthographicViewsGrid: true,

  /**
   * Sets whether the background grid is shown on the orthographic views.
   * @param shouldShowOrthographicViewsGrid - The new value.
   */
  setShouldShowOrthographicViewsGrid: (shouldShowOrthographicViewsGrid: boolean) => {
    set((state) => {
      state.shouldShowOrthographicViewsGrid = shouldShowOrthographicViewsGrid
    })
  },

  /** Whether the foreground structure is shown on the orthographic views. */
  shouldShowOrthographicStructure: true,

  /**
   * Sets whether the foreground structure is shown on the orthographic views.
   * @param shouldShowOrthographicStructure - The new value.
   */
  setShouldShowOrthographicStructure: (shouldShowOrthographicStructure: boolean) => {
    set((state) => {
      state.shouldShowOrthographicStructure = shouldShowOrthographicStructure
    })
  },

  /**
   * Detail required for every highlight kinds to allow switching between them,
   * null for no current highlight.
   */
  highlightedTarget: null,

  /**
   * Request highlight for a face, highlight kind determines the final highlight area.
   * @param cubeLocation - The cube location.
   * @param axis - Positive axis which the face is facing towards.
   */
  highlightCubeFace: (cubeLocation: CubeLocation, axis: PositiveAxis) => {
    set((state) => {
      state.highlightedTarget = { cubeLocation, axis }
    })
  },

  /**
   * Unhighlights if the `isCubeFaceHighlighted` function determines
   * that the given attributes match the current highlighting.
   * This is to prevent stale request if the highlight changes before the request is received.
   * @param highlightKind - Only unhighlights if the specified highlight kind is in effect.
   * @param cubeLocation - The cube location, used for attributes matching.
   */
  unhighlightCubeFace: (highlightKind: HighlightKind, cubeLocation: CubeLocation) => {
    if (isCubeFaceHighlighted(highlightKind, get().highlightedTarget, cubeLocation, null) !== null) {
      set((state) => { state.highlightedTarget = null })
    }
  },

  /** Cuboid values array, holds cuboids of one isometric structure. */
  cuboidValues: [
    { x: '0', y: '0', z: '0', dx: '1', dy: '1', dz: '1' }
  ],

  /**
   * Sets all cuboid values wholesale, use this in provider and prefer other functions in other components.
   * @param cuboidValues - The new values to take.
   */
  setCuboidValues: (cuboidValues: Array<CuboidValue>) => {
    set((state) => {
      state.cuboidValues = cuboidValues
    })
  },

  /**
   * Creates a new cuboid value at the end of the cuboid values array.
   * @param cuboidValue - A specific value to initialize with, default is a unit cube at origin.
   */
  newCuboidValue: (cuboidValue: CuboidValue = { x: '0', y: '0', z: '0', dx: '1', dy: '1', dz: '1' }) => {
    set((state) => {
      state.cuboidValues.push(cuboidValue)
      state.hasDefinitionChanged = true
    })
  },

  /**
   * Sets the cuboid value at the given index to the given value.
   * @param index - Index of the value in the cuboid values array.
   * @param cuboidValue - The new value.
   */
  setCuboidValue: (index: number, cuboidValue: CuboidValue) => {
    set((state) => {
      state.cuboidValues[index] = cuboidValue
      state.hasDefinitionChanged = true
    })
  },

  /**
   * Deletes a cuboid value at the given index.
   * @param index - Index of the value in the cuboid values array.
   */
  deleteCuboidValue: (index: number) => {
    set((state) => {
      state.cuboidValues.splice(index, 1)
      state.hasDefinitionChanged = true
    })
  },

  /** Quaternion to preserve non-commutative rotations compactly. */
  rotation: new Quaternion(),

  /** Resets the rotation such that the rendering coordinates matches the ones denoted in the cuboid values. */
  resetRotation: () => {
    set((state) => {
      state.rotation = new Quaternion()
      state.hasDefinitionChanged = true
    })
  },

  /** Rotates 90 degrees clockwise around x-axis (positive x), origin perspective. */
  rotateXClockwise: () => {
    set((state) => {
      state.rotation = Quaternion.fromAxisAngle([1, 0, 0], Math.PI / 2).mul(state.rotation)
      state.rotation = calibrateRotation(state.rotation)
      state.hasDefinitionChanged = true
    })
  },

  /** Rotates 90 degrees anticlockwise around x-axis (negative x), origin perspective. */
  rotateXAnticlockwise: () => {
    set((state) => {
      state.rotation = Quaternion.fromAxisAngle([1, 0, 0], -Math.PI / 2).mul(state.rotation)
      state.rotation = calibrateRotation(state.rotation)
      state.hasDefinitionChanged = true
    })
  },

  /** Rotates 90 degrees clockwise around y-axis (positive y), origin perspective. */
  rotateYClockwise: () => {
    set((state) => {
      state.rotation = Quaternion.fromAxisAngle([0, 1, 0], Math.PI / 2).mul(state.rotation)
      state.rotation = calibrateRotation(state.rotation)
      state.hasDefinitionChanged = true
    })
  },

  /** Rotates 90 degrees anticlockwise around y-axis (negative y), origin perspective. */
  rotateYAnticlockwise: () => {
    set((state) => {
      state.rotation = Quaternion.fromAxisAngle([0, 1, 0], -Math.PI / 2).mul(state.rotation)
      state.rotation = calibrateRotation(state.rotation)
      state.hasDefinitionChanged = true
    })
  },

  /** Rotates 90 degrees clockwise around z-axis (positive z), origin perspective. */
  rotateZClockwise: () => {
    set((state) => {
      state.rotation = Quaternion.fromAxisAngle([0, 0, 1], Math.PI / 2).mul(state.rotation)
      state.rotation = calibrateRotation(state.rotation)
      state.hasDefinitionChanged = true
    })
  },

  /** Rotates 90 degrees anticlockwise around z-axis (negative z), origin perspective. */
  rotateZAnticlockwise: () => {
    set((state) => {
      state.rotation = Quaternion.fromAxisAngle([0, 0, 1], -Math.PI / 2).mul(state.rotation)
      state.rotation = calibrateRotation(state.rotation)
      state.hasDefinitionChanged = true
    })
  }
}, ...initialPreference })))

/**
 * Provider that injects context value (the drawing store) for children that are using the drawing store.
 * It is an error to use components that relies on the drawing store without a provider parent.
 */
export function DrawingProvider({ initialDefinition, children }: PropsWithChildren<{ initialDefinition: InitialDefinition }>) {
  const storeRef = useRef<StoreApi<DrawingStore>|null>(null)

  const { drawingIndex, name, cuboidValues, rotation, ...rest } = initialDefinition

  // preference is not externally changeable after the first value
  // set it in the effect below if changing preference dynamically is required
  if (storeRef.current === null) storeRef.current = createDrawingStore(rest)

  const [
    setDrawingIndex,
    setName,
    setCuboidValues
  ] = useStore(storeRef.current, useShallow((state) => [
    state.setDrawingIndex,
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
          .map(({ x, y, z }) => ({ x: x.toString(), y: y.toString(), z: z.toString(), dx: '1', dy: '1', dz: '1' }))
      setCuboidValues(rotatedCuboidValues)

      // setting the drawing index must be last as this defines whether
      // a drawing definition has changed from the initial definition
      setDrawingIndex(drawingIndex)
    }
  }, [cuboidValues, drawingIndex, initialDefinition, name, rotation, setCuboidValues, setDrawingIndex, setName])

  return (
    <DrawingContext.Provider value={storeRef.current}>
      {children}
    </DrawingContext.Provider>
  )
}
