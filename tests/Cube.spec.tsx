import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import { Cube } from '../src/drawing/isometric/foreground/Cube'
import { DrawingProvider } from '../src/drawing/DrawingStore'
import { defaultDrawingDefinition } from '../src/Store'

test('renders cube with 6 triangular faces and 9 edges', async () => {
  const screen = await render(
    <DrawingProvider initialDefinition={defaultDrawingDefinition()}>
      <svg>
        <Cube cuboidIndex={0} x={0} y={0} z={0} spacing={4} cullFaces={[]} uncullLEdges={[]} cullObscured={[]} />
      </svg>
    </DrawingProvider>
  )

  expect(screen.asFragment().children[0].childElementCount).toBe(6 + 9)
})
