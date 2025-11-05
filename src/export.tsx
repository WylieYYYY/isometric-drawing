import type { IOptions } from 'canvg'
import type { ReactNode } from 'react'
import { Canvg, presets } from 'canvg'
import { BlobReader, BlobWriter, TextReader, ZipWriter } from '@zip.js/zip.js'

/** Timeout to make sure the download anchor has reacted to URL change. */
const BLOB_URL_TIMEOUT = 500

/**
 * Constructs a container that occupies the parent element fully and has class `export-container`
 * and wraps the given node in the container.
 * @param node - The node to be placed in the container.
 * @param display - The `display` CSS property for the container.
 * @returns The container.
 */
export function wrapWithExportContainer(node: ReactNode, display?: string): ReactNode {
  return (
    <div className='export-container' style={{ display: display, width: '100%', height: '100%' }}>
      {node}
    </div>
  )
}

/**
 * Rasterizes an SVG string into a PNG blob.
 * @param svg - String of the SVG content.
 * @returns The PNG blob.
 */
async function rasterizeSVGToPNGBlob(svg: string): Promise<Blob> {
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
 * @param svgSelector - Selector for a single or multiple SVGs.
 * @param asPNG - True to export PNGs, false to export SVGs.
 * @param parent - The element where the SVG selector is run, omit to run for the whole document.
 * @returns A blob that is either a PNG, an SVG or a ZIP file.
 */
export async function createExportBlob(svgsSelector: string, asPNG: boolean, parent?: Element): Promise<Blob> {
  const svgs = (parent ?? document).querySelectorAll(svgsSelector) as NodeListOf<SVGSVGElement>

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
 * Opens a download pop-up for the given blob, deduces a suitable file name.
 * Accepts blobs with either `image/png`, `image/svg+xml` or `application/zip` MIME type.
 * If the blob type is anthing other than the listed, it is assumed to be a ZIP file.
 * @param blob - File to be downloaded, in blob form.
 * @param setDownloadUrl - Function to set the URL for the download anchor.
 */
export function openDownloadPopup(blob: Blob, setDownloadUrl: (downloadUrl: string) => void) {
  const anchor = document.getElementById('download') as HTMLAnchorElement
  setDownloadUrl(URL.createObjectURL(blob))
  switch (blob.type) {
    case 'image/png':
      anchor.download = `export.png`
      break
    case 'image/svg+xml':
      anchor.download = `export.svg`
      break
    default:
      anchor.download = `export.zip`
      break
  }
  setTimeout(() => anchor.click(), BLOB_URL_TIMEOUT)
}
