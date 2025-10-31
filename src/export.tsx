import type { ReactNode } from 'react'

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
