import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

type Store = {
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

export const useStore = create<Store>()(immer((set) => ({
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
