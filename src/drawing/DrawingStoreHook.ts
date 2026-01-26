import type { StoreApi } from 'zustand'
import type { CuboidValue } from './control/CuboidStructureInputs.tsx'
import type { DrawingStore } from './DrawingStore.tsx'
import type { CubeLocation } from './../Store.tsx'
import { createContext, useContext } from 'react'
import { useStore } from 'zustand'

/** Context that a drawing provider provides, should only be used in drawing providers and hooks. */
export const DrawingContext = createContext<StoreApi<DrawingStore>|null>(null)

/**
 * Extracts an array of individual cube location by iterating over possible coordinates of cuboid values.
 * @param cuboidValues - Array of cuboid values to extract coordinates from.
 * @returns The cube locations.
 */
export function cubeLocationFromCuboidValues(cuboidValues: Array<CuboidValue>): Array<CubeLocation> {
  const cubeLocations = []

  for (const [cuboidIndex, cuboidValue] of cuboidValues.entries()) {
    if (Object.values(cuboidValue).some(isNaN)) continue

    const { x, y, z, dx, dy, dz } = cuboidValue

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
 * Uses storage for local drawing states to be shared by components.
 * @param selector - Selector for store properties, see available selectors in Zustand.
 * @returns Properties that are selected by the selector.
 */
export function useDrawingStore<Type>(selector: (state: DrawingStore) => Type) {
  const store = useContext(DrawingContext)
  return useStore(store!, selector)
}
