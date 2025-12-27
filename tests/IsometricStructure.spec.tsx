import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import { DrawingProvider } from '../src/drawing/DrawingStore'
import { IsometricStructure } from '../src/drawing/isometric/foreground/IsometricStructure'
import { defaultDrawingDefinition } from '../src/Store'

test('two adjacent cubes results in 10 triangular faces and 12 edges', async () => {
  const screen = await render(
    <DrawingProvider initialDefinition={defaultDrawingDefinition()}>
      <svg>
        <IsometricStructure
          spacing={4}
          cubeLocations={[
            { cuboidIndex: 0, x: 0, y: 0, z: 0 },
            { cuboidIndex: 0, x: 0, y: 1, z: 0 }
          ]}
        />
      </svg>
    </DrawingProvider>
  )

  expect(screen.asFragment().children[0].childElementCount).toBe(10 + 12)
})

test('two overlapping cubes results in 6 triangular faces and 9 edges', async () => {
  const screen = await render(
    <DrawingProvider initialDefinition={defaultDrawingDefinition()}>
      <svg>
        <IsometricStructure
          spacing={4}
          cubeLocations={[
            { cuboidIndex: 0, x: 0, y: 0, z: 0 },
            { cuboidIndex: 0, x: 1, y: 1, z: 1 }
          ]}
        />
      </svg>
    </DrawingProvider>
  )

  expect(screen.asFragment().children[0].childElementCount).toBe(6 + 9)
})
