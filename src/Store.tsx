import type { CuboidValue } from './CuboidStructureInputs.tsx'
import type { Coordinates } from './IsometricStructure.tsx'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

type CuboidNumberValue = { [Property in keyof CuboidValue]: number }

type Store = {
  cuboidValues: Array<CuboidValue>
  newCuboidValue: (cuboidValue?: CuboidValue) => void
  setCuboidValue: (index: number, cuboidValue: CuboidValue) => void
  deleteCuboidValue: (index: number) => void
  coordinatesFromCuboidValues: () => Array<Coordinates>

  XRotationCount: number
  rotateXClockwise: () => void
  rotateXAnticlockwise: () => void

  YRotationCount: number
  rotateYClockwise: () => void
  rotateYAnticlockwise: () => void

  ZRotationCount: number
  rotateZClockwise: () => void
  rotateZAnticlockwise: () => void
}

export const useStore = create<Store>()(immer((set, get) => ({
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

  XRotationCount: 0,

  rotateXClockwise: () => {
    set((state) => {
      state.XRotationCount = (state.XRotationCount + 1) % 4
    })
  },

  rotateXAnticlockwise: () => {
    set((state) => {
      state.XRotationCount = (state.XRotationCount + 3) % 4
    })
  },

  YRotationCount: 0,

  rotateYClockwise: () => {
    set((state) => {
      state.YRotationCount = (state.YRotationCount + 1) % 4
    })
  },

  rotateYAnticlockwise: () => {
    set((state) => {
      state.YRotationCount = (state.YRotationCount + 3) % 4
    })
  },

  ZRotationCount: 0,

  rotateZClockwise: () => {
    set((state) => {
      state.ZRotationCount = (state.ZRotationCount + 1) % 4
    })
  },

  rotateZAnticlockwise: () => {
    set((state) => {
      state.ZRotationCount = (state.ZRotationCount + 3) % 4
    })
  }
})))
