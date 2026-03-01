import type { PropsWithChildren } from 'react'

export type ExportContainerProps = {
  /** The `display` CSS property for the container. */
  display?: string
}

/**
 * Container that marks the SVG elements within it a part of export.
 * It occupies the parent element fully and has class `export-container`.
 */
export function ExportContainer({ display, children }: PropsWithChildren<ExportContainerProps>) {
  return (
    <div className='export-container' style={{ display, width: '100%', height: '100%' }}>
      {children}
    </div>
  )
}
