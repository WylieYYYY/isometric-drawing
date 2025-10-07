import type { CuboidValue } from './CuboidStructureInputs.tsx'
import type { Coordinates, PositiveAxis } from './IsometricStructure.tsx'
import { Quaternion } from 'quaternion'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export type HighlightKind = 'cuboid' | 'face'
export type CubeLocation = { cuboidIndex: number } & Coordinates

type CuboidNumberValue = { [Property in keyof CuboidValue]: number }
type VisibleCubeFaceLocation = { coordinates: Coordinates, axis: PositiveAxis }

type Store = {
  highlightKind: HighlightKind
  highlightedTarget: VisibleCubeFaceLocation|number|null
  highlightCubeFace: (cubeLocation: CubeLocation, axis: PositiveAxis) => void
  unhighlightCubeFace: (cubeLocation: CubeLocation) => void

  cuboidValues: Array<CuboidValue>
  newCuboidValue: (cuboidValue?: CuboidValue) => void
  setCuboidValue: (index: number, cuboidValue: CuboidValue) => void
  deleteCuboidValue: (index: number) => void

  rotation: Quaternion

  rotateXClockwise: () => void
  rotateXAnticlockwise: () => void

  rotateYClockwise: () => void
  rotateYAnticlockwise: () => void

  rotateZClockwise: () => void
  rotateZAnticlockwise: () => void
}

export function isCubeFaceHighlighted(
  highlightedTarget: VisibleCubeFaceLocation|number|null,
  cubeLocation: CubeLocation,
  axis: PositiveAxis|null
): HighlightKind|null {
  if (highlightedTarget === null) return null

  if (typeof highlightedTarget === 'number') {
    if (cubeLocation.cuboidIndex === highlightedTarget) return 'cuboid'
    return null
  }

  const faceHighlighted = cubeLocation.x === highlightedTarget.coordinates.x &&
      cubeLocation.y === highlightedTarget.coordinates.y &&
      cubeLocation.z === highlightedTarget.coordinates.z &&
      (axis === null || axis === highlightedTarget.axis)

  if (faceHighlighted) return 'face'
  return null
}

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

export const useStore = create<Store>()(immer((set, get) => ({
  highlightKind: 'face',
  highlightedTarget: null,

  highlightCubeFace: (cubeLocation: CubeLocation, axis: PositiveAxis) => {
    const { cuboidIndex, ...coordinates } = cubeLocation
    set((state) => {
      switch (get().highlightKind) {
        case 'cuboid':
          state.highlightedTarget = cuboidIndex
          break
        case 'face':
          state.highlightedTarget = { coordinates, axis }
          break
      }
    })
  },

  unhighlightCubeFace: (cubeLocation: CubeLocation) => {
    if (isCubeFaceHighlighted(get().highlightedTarget, cubeLocation, null) !== null) {
      set((state) => { state.highlightedTarget = null })
    }
  },

  cuboidValues: [
    { x: '0', y: '0', z: '0', dx: '1', dy: '2', dz: '1' },
    { x: '1', y: '0', z: '0', dx: '1', dy: '1', dz: '3' }
  ],

  newCuboidValue: (cuboidValue: CuboidValue = { x: '0', y: '0', z: '0', dx: '1', dy: '1', dz: '1' }) => {
    set((state) => {
      state.cuboidValues.push(cuboidValue)
    })
  },

  setCuboidValue: (index: number, cuboidValue: CuboidValue) => {
    set((state) => {
      state.cuboidValues[index] = cuboidValue
    })
  },

  deleteCuboidValue: (index: number) => {
    set((state) => {
      state.cuboidValues.splice(index, 1)
    })
  },

  rotation: new Quaternion(),

  rotateXClockwise: () => {
    set((state) => {
      state.rotation = Quaternion.fromAxisAngle([1, 0, 0], Math.PI / 2).mul(state.rotation)
      state.rotation = calibrateRotation(state.rotation)
    })
  },

  rotateXAnticlockwise: () => {
    set((state) => {
      state.rotation = Quaternion.fromAxisAngle([1, 0, 0], -Math.PI / 2).mul(state.rotation)
      state.rotation = calibrateRotation(state.rotation)
    })
  },

  rotateYClockwise: () => {
    set((state) => {
      state.rotation = Quaternion.fromAxisAngle([0, 1, 0], Math.PI / 2).mul(state.rotation)
      state.rotation = calibrateRotation(state.rotation)
    })
  },

  rotateYAnticlockwise: () => {
    set((state) => {
      state.rotation = Quaternion.fromAxisAngle([0, 1, 0], -Math.PI / 2).mul(state.rotation)
      state.rotation = calibrateRotation(state.rotation)
    })
  },

  rotateZClockwise: () => {
    set((state) => {
      state.rotation = Quaternion.fromAxisAngle([0, 0, 1], Math.PI / 2).mul(state.rotation)
      state.rotation = calibrateRotation(state.rotation)
    })
  },

  rotateZAnticlockwise: () => {
    set((state) => {
      state.rotation = Quaternion.fromAxisAngle([0, 0, 1], -Math.PI / 2).mul(state.rotation)
      state.rotation = calibrateRotation(state.rotation)
    })
  }
})))
