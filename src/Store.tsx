import type { CuboidValue } from './CuboidStructureInputs.tsx'
import type { Coordinates, PositiveAxis } from './IsometricStructure.tsx'
import { Quaternion } from 'quaternion'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export type HighlightKind = 'cuboid' | 'face'
export type CubeLocation = { cuboidIndex: number } & Coordinates

type CuboidNumberValue = { [Property in keyof CuboidValue]: number }
type VisibleCubeFaceLocation = { cubeLocation: CubeLocation, axis: PositiveAxis }

type Store = {
  highlightKind: HighlightKind
  setHighlightKind: (highlightKind: HighlightKind) => void

  highlightedTarget: VisibleCubeFaceLocation|null
  highlightCubeFace: (cubeLocation: CubeLocation, axis: PositiveAxis) => void
  unhighlightCubeFace: (cubeLocation: CubeLocation) => void

  cuboidValues: Array<CuboidValue>
  newCuboidValue: (cuboidValue?: CuboidValue) => void
  setCuboidValue: (index: number, cuboidValue: CuboidValue) => void
  deleteCuboidValue: (index: number) => void

  rotation: Quaternion

  resetRotation: () => void

  rotateXClockwise: () => void
  rotateXAnticlockwise: () => void

  rotateYClockwise: () => void
  rotateYAnticlockwise: () => void

  rotateZClockwise: () => void
  rotateZAnticlockwise: () => void
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

/** Uses storage for global states to be shared by components. */
export const useStore = create<Store>()(immer((set, get) => ({
  highlightKind: 'face',

  setHighlightKind: (highlightKind: HighlightKind) => {
    set((state) => {
      state.highlightKind = highlightKind
    })
  },

  highlightedTarget: null,

  highlightCubeFace: (cubeLocation: CubeLocation, axis: PositiveAxis) => {
    set((state) => {
      state.highlightedTarget = { cubeLocation, axis }
    })
  },

  unhighlightCubeFace: (cubeLocation: CubeLocation) => {
    if (isCubeFaceHighlighted(get().highlightKind, get().highlightedTarget, cubeLocation, null) !== null) {
      set((state) => { state.highlightedTarget = null })
    }
  },

  /** Cuboid values array, holds cuboids of one isometric structure. */
  cuboidValues: [
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
  rotation: new Quaternion(),

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
