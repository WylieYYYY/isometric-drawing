import type { IOptions } from 'canvg'
import type { ButtonHTMLAttributes, RefObject } from 'react'
import { useRef } from 'react'
import { openDownloadPopup } from './../util.ts'

export type ExportButtonProps = {
  /**
   * Text to be displayed after `Export` on the button.
   * Default is `PNG` or `SVG` depending on `asPNG`.
   */
  text?: string
  /** True to export PNGs, false to export SVGs. */
  asPNG: boolean
  /**
   * Reference to the parent element that contains one or more export containers.
   * The reference can be temporarily null, but should not be when this button is clickable.
   */
  containerParentRef: RefObject<Element|null>
  /** Filename of the export, not including extension which will automatically be determined. */
  filename?: string
}

/**
 * Rasterizes an SVG string into a PNG blob.
 * @param svg - String of the SVG content.
 * @returns The PNG blob.
 */
async function rasterizeSVGToPNGBlob(svg: string): Promise<Blob> {
  const { Canvg, presets } = await import('canvg')

  const canvas = new OffscreenCanvas(0, 0)
  const ctx = canvas.getContext('2d')!
  const canvg = await Canvg.from(ctx, svg, presets.offscreen() as IOptions)
  canvg.resize(2400, 2400)

  await canvg.render()

  return await canvas.convertToBlob()
}

/**
 * Creates a suitable export blob depending on how many SVGs are selected.
 * If there is only one, the blob will be an image. Otherwise, the blob will be a ZIP file.
 * The SVG elements should have `data-export-name` attributes to be used as part of the file names.
 * @param parent - The element where the SVG selector is run.
 * @param asPNG - True to export PNGs, false to export SVGs.
 * @returns A blob that is either a PNG, an SVG or a ZIP file.
 */
async function createExportBlob(parent: Element, asPNG: boolean): Promise<Blob> {
  const { BlobReader, BlobWriter, TextReader, ZipWriter } = await import('@zip.js/zip.js')

  const svgs = parent.querySelectorAll('.export-container svg') as NodeListOf<SVGSVGElement>

  if (svgs.length === 1) {
    if (asPNG) return await rasterizeSVGToPNGBlob(svgs[0].outerHTML)
    return new Blob([svgs[0].outerHTML], { type: 'image/svg+xml' })
  }

  const zipFileWriter = new BlobWriter()

  const zipWriter = new ZipWriter(zipFileWriter)
  for (const [index, svg] of svgs.entries()) {
    const svgReader = asPNG ? new BlobReader(await rasterizeSVGToPNGBlob(svg.outerHTML)) : new TextReader(svg.outerHTML)
    await zipWriter.add(asPNG ? `${index}-${svg.dataset.exportName}.png` : `${index}-${svg.dataset.exportName}.svg`, svgReader)
  }
  await zipWriter.close()

  return await zipFileWriter.getData()
}

/**
 * Export button that opens a download pop-up for export containers under the specified parent.
 * If there is one SVG element, a single image file is downloaded. Otherwise they will be added to an archive.
 */
export function ExportButton({
  text, asPNG, containerParentRef, filename, ...props
}: ExportButtonProps & Exclude<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>) {
  const downloadAnchorRef = useRef<HTMLAnchorElement|null>(null)

  return (
    <span>
      <a ref={downloadAnchorRef} style={{ display: 'none' }}></a>
      <button onClick={async () => openDownloadPopup(await createExportBlob(containerParentRef.current!, asPNG), downloadAnchorRef.current!, filename)} {...props}>
        Export {text ?? (asPNG ? 'PNG' : 'SVG')}
      </button>
    </span>
  )
}
