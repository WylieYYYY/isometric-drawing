/* eslint-disable react-refresh/only-export-components */

// parameter types
export type { DownloadDefinitionButtonProps } from './io/DownloadDefinitionButton.tsx'
export type { DrawingStore, InitialDefinition } from './drawing/DrawingStore.tsx'
export type { ExportButtonProps } from './io/ExportButton.tsx'
export type { ExportContainerProps } from './io/ExportContainer.tsx'
export type { IsometricViewportProps } from './drawing/isometric/IsometricViewport.tsx'
export type { IsometricViewport3DProps } from './drawing/3d/IsometricViewport3D.tsx'
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

// renderers for calculating the required edges in an isometric drawing
export * as Renderer3D from './drawing/3d/Renderer3D.ts'

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
export { IsometricViewport3D } from './drawing/3d/IsometricViewport3D.tsx'
export { OrthographicViews } from './drawing/auxiliary/OrthographicViews.tsx'

// container for export targeting
export { ExportContainer } from './io/ExportContainer.tsx'
// controls that interact with files
export { DownloadDefinitionButton } from './io/DownloadDefinitionButton.tsx'
export { ExportButton } from './io/ExportButton.tsx'
export { UploadDefinitionButton } from './io/UploadDefinitionButton.tsx'

// additional utility exports
export type { CoordinatesLike } from './util.ts'
import { cubeLocationFromCuboidValues } from './drawing/DrawingStoreHook.ts'
import { rotate, updateMinMax } from './util.ts'

/** Utility functions for working with cuboid values. */
export const Utility = {
  /**
   * Extracts an array of individual cube location by iterating over possible coordinates of cuboid values.
   * @param cuboidValues - Array of cuboid values to extract coordinates from.
   * @returns The cube locations.
   */
  cubeLocationFromCuboidValues,

  /**
   * Rotates coordinates with the given quaternion rotation.
   * @param coordinates - Array of coordinates that may have auxiliary data attached to them, like a cube location.
   * @returns The rotated array of coordinates combined with the unchanged auxiliary data.
   */
  rotate,

  /**
   * Updates an accumulator of minimum and maximum values with a new value in place.
   * For example, let the accumulator be { attr1: { min: Infinity, max: -Infinity }, attr2: { min: 1, max: 9 } } and
   * let the values be { attr1: 5, attr2: 10 }.
   * The accumulator will then be updated to { attr1: { min: 5, max: 5 }, attr2: { min: 1, max: 10 } }.
   * @param accMinMax - The accumulator.
   * @param values - The new values to be compared against.
   */
  updateMinMax
}
