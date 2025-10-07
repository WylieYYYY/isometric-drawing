import type { CuboidValue } from './CuboidStructureInputs.tsx'
import type { Coordinates, PositiveAxis } from './IsometricStructure.tsx'
import { Quaternion } from 'quaternion'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

type CuboidNumberValue = { [Property in keyof CuboidValue]: number }
type VisibleCubeFaceLocation = { coordinates: Coordinates, axis: PositiveAxis }

type Store = {
  highlightedCubeFace: VisibleCubeFaceLocation|null
  highlightCubeFace: (coordinates: Coordinates, axis: PositiveAxis) => void
  unhighlightCubeFace: (coordinates: Coordinates) => void

  cuboidValues: Array<CuboidValue>
  newCuboidValue: (cuboidValue?: CuboidValue) => void
  setCuboidValue: (index: number, cuboidValue: CuboidValue) => void
  deleteCuboidValue: (index: number) => void
  coordinatesFromCuboidValues: () => Array<Coordinates>

  rotation: Quaternion

  rotateXClockwise: () => void
  rotateXAnticlockwise: () => void

  rotateYClockwise: () => void
  rotateYAnticlockwise: () => void

  rotateZClockwise: () => void
  rotateZAnticlockwise: () => void
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

export function isCubeFaceHighlighted(
  highlightedCubeFace: VisibleCubeFaceLocation|null,
  coordinates: Coordinates,
  axis: PositiveAxis|null
): boolean {
  return highlightedCubeFace !== null &&
      coordinates.x === highlightedCubeFace.coordinates.x &&
      coordinates.y === highlightedCubeFace.coordinates.y &&
      coordinates.z === highlightedCubeFace.coordinates.z &&
      (axis === null || axis === highlightedCubeFace.axis)
}

export const useStore = create<Store>()(immer((set, get) => ({
  highlightedCubeFace: null,

  highlightCubeFace: (coordinates: Coordinates, axis: PositiveAxis) => {
    set((state) => {
      state.highlightedCubeFace = { coordinates, axis }
    })
  },

  unhighlightCubeFace: (coordinates: Coordinates) => {
    if (isCubeFaceHighlighted(get().highlightedCubeFace, coordinates, null)) {
      set((state) => { state.highlightedCubeFace = null })
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

  coordinatesFromCuboidValues: () => {
    const coordinates = []

    for (const cuboidValue of get().cuboidValues) {
      const parsedCuboidValue: { [key: string]: number } = {}
      for (const [key, value] of Object.entries(cuboidValue)) parsedCuboidValue[key] = parseInt(value)
      if (Object.values(parsedCuboidValue).some(isNaN)) continue

      const { x, y, z, dx, dy, dz } = parsedCuboidValue as CuboidNumberValue

      for (let currentDx = 0; currentDx !== dx; currentDx += Math.sign(dx)) {
        for (let currentDy = 0; currentDy !== dy; currentDy += Math.sign(dy)) {
          for (let currentDz = 0; currentDz !== dz; currentDz += Math.sign(dz)) {
            coordinates.push({ x: x + currentDx, y: y + currentDy, z: z + currentDz })
          }
        }
      }
    }

    return coordinates
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
