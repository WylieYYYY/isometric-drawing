import type { PropsWithChildren } from 'react'
import type { StoreApi } from 'zustand'
import type { CuboidValue } from './control/CuboidStructureInputs.tsx'
import type { PositiveAxis } from './isometric/foreground/IsometricStructure.tsx'
import type { CubeLocation, HighlightKind, VisibleCubeFaceLocation } from './../Store.tsx'
import { Quaternion } from 'quaternion'
import { useEffect, useRef } from 'react'
import { createStore, useStore } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { cubeLocationFromCuboidValues, DrawingContext } from './DrawingStoreHook.ts'
import { isCubeFaceHighlighted } from './../Store.tsx'
import { rotate } from './../util.ts'

export type DrawingDefinition = {
  drawingIndex: number|null
  name: string
  cuboidValues: Array<CuboidValue>
  rotation: Quaternion
}

export type DrawingStore = DrawingDefinition & {
  hasDefinitionChanged: boolean,

  setDrawingIndex: (drawingIndex: number|null) => void

  setName: (name: string) => void

  isInteractive: boolean

  shouldCropIsometricViewport: boolean
  setShouldCropIsometricViewport: (shouldCropIsometricViewport: boolean) => void

  shouldShowIsometricGrid: boolean
  setshouldShowIsometricGrid: (shouldShowIsometricGrid: boolean) => void

  shouldShowAxisArrows: boolean
  setShouldShowAxisArrows: (shouldShowAxisArrows: boolean) => void

  shouldShowIsometricStructure: boolean
  setshouldShowIsometricStructure: (shouldShowIsometricStructure: boolean) => void

  shouldShowCodedPlanNumbers: boolean
  setShouldShowCodedPlanNumbers: (shouldShowCodedPlanNumbers: boolean) => void

  shouldSplitOrthographicViewsAsThree: boolean
  setShouldSplitOrthographicViewsAsThree: (shouldSplitOrthographicViewsAsThree: boolean) => void

  shouldShowOrthographicViewsGrid: boolean
  setShouldShowOrthographicViewsGrid: (shouldShowOrthographicViewsGrid: boolean) => void

  shouldShowOrthographicStructure: boolean
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

type InitialDefinition = DrawingDefinition & { isInteractive?: boolean }

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

const createDrawingStore = (initialDefinition?: Partial<InitialDefinition>) => createStore<DrawingStore>()(immer((set, get) => ({
  hasDefinitionChanged: false,

  drawingIndex: initialDefinition?.drawingIndex ?? null,

  setDrawingIndex: (drawingIndex: number|null) => {
    set((state) => {
      state.drawingIndex = drawingIndex
      state.hasDefinitionChanged = drawingIndex === null
    })
  },

  name: initialDefinition?.name ?? 'Untitled Drawing',

  setName: (name: string) => {
    set((state) => {
      state.name = name
      state.hasDefinitionChanged = true
    })
  },

  isInteractive: initialDefinition?.isInteractive ?? true,

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

  /** Cuboid values array, holds cuboids of one isometric structure. */
  cuboidValues: initialDefinition?.cuboidValues ?? [
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
   * @param cuboidValue - The replacement value.
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
  rotation: initialDefinition?.rotation ?? new Quaternion(),

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
})))

export function DrawingProvider({ initialDefinition, children }: PropsWithChildren<{ initialDefinition?: InitialDefinition }>) {
  const storeRef = useRef<StoreApi<DrawingStore>|null>(null)
  if (storeRef.current === null) storeRef.current = createDrawingStore({ isInteractive: initialDefinition?.isInteractive })

  const setDrawingIndex = useStore(storeRef.current, (state) => state.setDrawingIndex)
  const setName = useStore(storeRef.current, (state) => state.setName)
  const setCuboidValues = useStore(storeRef.current, (state) => state.setCuboidValues)

  useEffect(() => {
    if (initialDefinition !== undefined) {
      setName(initialDefinition.name)

      // pre-apply rotation so that the rotation for a provider is separate from the initial definition
      // removing cuboid support removes the need for marshalling
      const cubeLocations = cubeLocationFromCuboidValues(initialDefinition.cuboidValues)
      const rotatedCuboidValues = rotate(cubeLocations, initialDefinition.rotation)
          .map(({ x, y, z }) => ({ x: x.toString(), y: y.toString(), z: z.toString(), dx: '1', dy: '1', dz: '1' }))
      setCuboidValues(rotatedCuboidValues)

      // setting the drawing index must be last as this defines whether
      // a drawing definition has changed from the initial definition
      setDrawingIndex(initialDefinition.drawingIndex)
    }
  }, [initialDefinition, setCuboidValues, setDrawingIndex, setName])

  return (
    <DrawingContext.Provider value={storeRef.current}>
      {children}
    </DrawingContext.Provider>
  )
}
