import type { StoreApi } from 'zustand'
import type { DrawingStore } from './DrawingStore.tsx'
import { createContext, useContext } from 'react'
import { useStore } from 'zustand'

export const DrawingContext = createContext<StoreApi<DrawingStore>|null>(null)

export function useDrawingStore<Type>(selector: (state: DrawingStore) => Type) {
  const store = useContext(DrawingContext)
  return useStore(store!, selector)
}
