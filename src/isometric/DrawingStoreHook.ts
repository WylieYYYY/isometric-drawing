import type { StoreApi } from 'zustand'
import type { DrawingStore } from './DrawingStore.tsx'
import { createContext, useContext } from 'react'
import { useStore } from 'zustand'

export const IsometricContext = createContext<StoreApi<DrawingStore>|null>(null)

export function useDrawingStore<Type>(selector: (state: DrawingStore) => Type) {
  const store = useContext(IsometricContext)
  return useStore(store!, selector)
}
