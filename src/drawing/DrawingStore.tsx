import type { PropsWithChildren } from 'react'
import type { StoreApi } from 'zustand'
import type { CuboidValue } from './control/CuboidStructureInputs.tsx'
import type { PositiveAxis } from './isometric/foreground/IsometricStructure.tsx'
import type { CubeLocation, HighlightKind, VisibleCubeFaceLocation } from './../Store.tsx'
import { useRef } from 'react'
import { Quaternion } from 'quaternion'
import { createStore } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { DrawingContext } from './DrawingStoreHook.ts'
import { isCubeFaceHighlighted } from './../Store.tsx'

type DrawingDefinition = {
  isInteractive?: boolean
  cuboidValues: Array<CuboidValue>
  rotation: Quaternion
}

export type DrawingStore = DrawingDefinition & {
  shouldShowGrid: boolean
  setShouldShowGrid: (shouldShowGrid: boolean) => void

  shouldShowAxisArrows: boolean
  setShouldShowAxisArrows: (shouldShowAxisArrows: boolean) => void

  shouldShowCodedPlanNumbers: boolean
  setShouldShowCodedPlanNumbers: (shouldShowCodedPlanNumbers: boolean) => void

  shouldSplitOrthographicViewsAsThree: boolean
  setShouldSplitOrthographicViewsAsThree: (shouldSplitOrthographicViewsAsThree: boolean) => void

  highlightedTarget: VisibleCubeFaceLocation|null
  highlightCubeFace: (cubeLocation: CubeLocation, axis: PositiveAxis) => void
  unhighlightCubeFace: (highlightKind: HighlightKind, cubeLocation: CubeLocation) => void

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

const createDrawingStore = (initialDefinition?: DrawingDefinition) => createStore<DrawingStore>()(immer((set, get) => ({
  isInteractive: initialDefinition?.isInteractive ?? true,

  shouldShowGrid: true,

  setShouldShowGrid: (shouldShowGrid: boolean) => {
    set((state) => {
      state.shouldShowGrid = shouldShowGrid
    })
  },

  shouldShowAxisArrows: true,

  setShouldShowAxisArrows: (shouldShowAxisArrows: boolean) => {
    set((state) => {
      state.shouldShowAxisArrows = shouldShowAxisArrows
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
   * Creates a new cuboid value at the end of the cuboid values array.
   * @param cuboidValue - A specific value to initialize with, default is a unit cube at origin.
   */
  newCuboidValue: (cuboidValue: CuboidValue = { x: '0', y: '0', z: '0', dx: '1', dy: '1', dz: '1' }) => {
    set((state) => {
      state.cuboidValues.push(cuboidValue)
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
    })
  },

  /**
   * Deletes a cuboid value at the given index.
   * @param index - Index of the value in the cuboid values array.
   */
  deleteCuboidValue: (index: number) => {
    set((state) => {
      state.cuboidValues.splice(index, 1)
    })
  },

  /** Quaternion to preserve non-commutative rotations compactly. */
  rotation: initialDefinition?.rotation ?? new Quaternion(),

  /** Resets the rotation such that the rendering coordinates matches the ones denoted in the cuboid values. */
  resetRotation: () => {
    set((state) => {
      state.rotation = new Quaternion()
    })
  },

  /** Rotates 90 degrees clockwise around x-axis (positive x), origin perspective. */
  rotateXClockwise: () => {
    set((state) => {
      state.rotation = Quaternion.fromAxisAngle([1, 0, 0], Math.PI / 2).mul(state.rotation)
      state.rotation = calibrateRotation(state.rotation)
    })
  },

  /** Rotates 90 degrees anticlockwise around x-axis (negative x), origin perspective. */
  rotateXAnticlockwise: () => {
    set((state) => {
      state.rotation = Quaternion.fromAxisAngle([1, 0, 0], -Math.PI / 2).mul(state.rotation)
      state.rotation = calibrateRotation(state.rotation)
    })
  },

  /** Rotates 90 degrees clockwise around y-axis (positive y), origin perspective. */
  rotateYClockwise: () => {
    set((state) => {
      state.rotation = Quaternion.fromAxisAngle([0, 1, 0], Math.PI / 2).mul(state.rotation)
      state.rotation = calibrateRotation(state.rotation)
    })
  },

  /** Rotates 90 degrees anticlockwise around y-axis (negative y), origin perspective. */
  rotateYAnticlockwise: () => {
    set((state) => {
      state.rotation = Quaternion.fromAxisAngle([0, 1, 0], -Math.PI / 2).mul(state.rotation)
      state.rotation = calibrateRotation(state.rotation)
    })
  },

  /** Rotates 90 degrees clockwise around z-axis (positive z), origin perspective. */
  rotateZClockwise: () => {
    set((state) => {
      state.rotation = Quaternion.fromAxisAngle([0, 0, 1], Math.PI / 2).mul(state.rotation)
      state.rotation = calibrateRotation(state.rotation)
    })
  },

  /** Rotates 90 degrees anticlockwise around z-axis (negative z), origin perspective. */
  rotateZAnticlockwise: () => {
    set((state) => {
      state.rotation = Quaternion.fromAxisAngle([0, 0, 1], -Math.PI / 2).mul(state.rotation)
      state.rotation = calibrateRotation(state.rotation)
    })
  }
})))

export function DrawingProvider({ initialDefinition, children }: PropsWithChildren<{ initialDefinition?: DrawingDefinition }>) {
  const storeRef = useRef<StoreApi<DrawingStore>|null>(null)
  if (storeRef.current === null || initialDefinition !== undefined) storeRef.current = createDrawingStore(initialDefinition)

  return (
    <DrawingContext.Provider value={storeRef.current}>
      {children}
    </DrawingContext.Provider>
  )
}
