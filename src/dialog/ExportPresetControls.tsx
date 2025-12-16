import type { DrawingPreference } from './../drawing/DrawingStore.tsx'
import type { DrawingKind, ExportCardProps } from './ExportCard.tsx'
import { useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { openDownloadPopup } from './../export.tsx'
import { useStore } from './../Store.tsx'

type ExportPresetControlsProps = {
  parent: Element
  setDownloadUrl: (downloadUrl: string) => void
}

/**
 * Preferences that are configurable in a JSON file.
 * Currently, this is all keys in the drawing preference type.
 * Which leaves out:
 *  - euphermeral attributes: These are application internal states and changes with user interaction.
 *    In this case, no interaction is allowed so none of these attributes change.
 *  - is interactive: Does not make sense to allow interactivity within an export card.
 *  - drawing definition attributes: A placeholder is displayed instead.
 */
const DRAWING_PREFERENCE_KEYS = [
  'shouldCropIsometricViewport',
  'shouldShowIsometricGrid',
  'shouldShowAxisArrows',
  'shouldShowIsometricStructure',
  'shouldShowCodedPlanNumbers',
  'shouldSplitOrthographicViewsAsThree',
  'shouldShowOrthographicViewsGrid',
  'shouldShowOrthographicStructure'
] as const

/**
 * Parses the given file as JSON and adds the specified export cards with placeholders displayed in them.
 * Do nothing and alert if the file is not of the correct format.
 * @param file - File object provided by a file input that contains a JSON representation.
 * @param newExportCard - Constructor function for export cards.
 */
async function loadJSON(file: File, newExportCard: (props?: Omit<ExportCardProps, 'deleteCallback'>) => void) {
  try {
    const json = JSON.parse(await file.text())
    if (!(json instanceof Array)) throw new Error(`Expected JSON array, got ${typeof json}.`)

    for (const cardDetail of json) {
      const drawingKind = cardDetail['drawingKind']

      if (typeof drawingKind !== 'string') throw new Error(`Expected drawing kind to be a string, got ${typeof drawingKind}.`)
      if (!['isometric', 'coded-plan', 'orthographic', 'orthographic-editor'].includes(drawingKind)) {
        throw new Error('Drawing kind is not one of the valid values.')
      }

      // preference can be omitted, but must have valid type when set
      const preference: Partial<DrawingPreference> = { }
      for (const key of DRAWING_PREFERENCE_KEYS) {
        if (typeof cardDetail[key] === 'boolean') {
          preference[key] = cardDetail[key]
        } else if (key in cardDetail) {
          throw new Error(`Expected ${key} to be a boolean, got ${typeof cardDetail[key]}.`)
        }
      }

      newExportCard({
        initialDrawingKind: drawingKind as DrawingKind,
        initialPreference: preference,
        startWithPlaceholder: true
      })
    }
  } catch (error: unknown) {
    alert((error as Error).message + ' Load aborted.')
  }
}

/**
 * Opens a download pop-up after curating the preset.
 * @param parent - The element where the selector is run to find data containers.
 * @param setDownloadUrl - Function to set the URL for the download anchor.
 */
function downloadJSON(parent: Element, setDownloadUrl: (downloadUrl: string) => void) {
  const dataContainers = [...parent.querySelectorAll('.data-container')] as Array<HTMLElement>
  const content = '[' + dataContainers.map((container) => container.dataset.presetJson!).join(',') + ']\n'
  openDownloadPopup(new Blob([content], { type: 'application/json' }), setDownloadUrl, 'preset')
}

/** Buttons for saving and loading presets in JSON. */
export function ExportPresetControls({ parent, setDownloadUrl }: ExportPresetControlsProps) {
  const fileInputRef = useRef<HTMLInputElement|null>(null)

  const [
    clearExportCards,
    newExportCard
  ] = useStore(useShallow((state) => [
    state.clearExportCards,
    state.newExportCard
  ]))

  return (
    <label>
      <button onClick={() => downloadJSON(parent, setDownloadUrl)}>Save preset to JSON</button>
      <button onClick={() => fileInputRef.current!.click()}>Load preset from JSON</button>
      <input
        ref={fileInputRef}
        type='file'
        accept='application/json'
        onChange={
          (event) => {
            clearExportCards()
            loadJSON(event.target.files![0], newExportCard)
          }
        }
        style={{ display: 'none' }}
      />
    </label>
  )
}
