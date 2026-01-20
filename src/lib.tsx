/* eslint-disable react-refresh/only-export-components */

// parameter types
export type { DrawingStore, InitialDefinition } from './drawing/DrawingStore.tsx'
export type { IsometricViewportProps } from './drawing/isometric/IsometricViewport.tsx'
export type { OrthographicEditorProps } from './dialog/OrthographicEditor.tsx'
export type { OrthographicViewsProps } from './drawing/auxiliary/OrthographicViews.tsx'

// transitive types
export type { CuboidValue, CuboidValueComponent } from './drawing/control/CuboidStructureInputs.tsx'
export type { DrawingDefinition, DrawingPreference, InitialPreference } from './drawing/DrawingStore.tsx'
export type { Coordinates, PositiveAxis } from './drawing/isometric/foreground/IsometricStructure.tsx'
export type { LineType } from './dialog/OrthographicEditorLine.tsx'
export type { CubeLocation, HighlightKind, VisibleCubeFaceLocation } from './Store.tsx'

// re-export quaternion for convenience
export { Quaternion } from 'quaternion'

// standalone editor requiring no provider
export { OrthographicEditor } from './dialog/OrthographicEditor.tsx'

// provider for components using the drawing store
export { DrawingProvider } from './drawing/DrawingStore.tsx'
// exposes drawing store for functionality extension
export { useDrawingStore } from './drawing/DrawingStoreHook.ts'

// controls that uses the drawing store
export { CodedPlanControls } from './drawing/control/CodedPlanControls.tsx'
export { CuboidStructureInputs } from './drawing/control/CuboidStructureInputs.tsx'
export { IsometricControls } from './drawing/control/IsometricControls.tsx'
export { OrthographicControls } from './drawing/control/OrthographicControls.tsx'
export { RotationButtons } from './drawing/control/RotationButtons.tsx'

// displays that uses the drawing store
export { CodedPlan } from './drawing/auxiliary/CodedPlan.tsx'
export { IsometricViewport } from './drawing/isometric/IsometricViewport.tsx'
export { OrthographicViews } from './drawing/auxiliary/OrthographicViews.tsx'
