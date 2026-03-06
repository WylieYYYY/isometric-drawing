import type { Coordinates } from './../isometric/foreground/IsometricStructure.tsx'

/**
 * Calculates where edges should be displayed from a list of cube coordinates using a map.
 * @param coordinates - List of cube coordinates.
 * @returns A generator that generates edges to be displayed, edges are represented as tuples of coordinates for start and end points.
 */
function* calculateEdgesMap(coordinates: Array<Coordinates>): Generator<[Coordinates, Coordinates], void, number|undefined> {
  const map: Record<string, boolean> = { }

  // loop over all coordinates and assign value that is not undefined
  for (const { x, y, z } of coordinates) map[`${x} ${y} ${z}`] = true

  // loop again to check if each of them have neighbors, render it
  for (const { x, y, z } of coordinates) {
    let inner = 0b111111

    if (map[`${x + 1} ${y} ${z}`] !== undefined) inner &= 0b110111
    if (map[`${x} ${y + 1} ${z}`] !== undefined) inner &= 0b101111
    if (map[`${x} ${y} ${z + 1}`] !== undefined) inner &= 0b011111
    if (map[`${x - 1} ${y} ${z}`] !== undefined) inner &= 0b111110
    if (map[`${x} ${y - 1} ${z}`] !== undefined) inner &= 0b111101
    if (map[`${x} ${y} ${z - 1}`] !== undefined) inner &= 0b111011

    yield* calculateCubeEdges({ x, y, z }, inner)
  }
}

/**
 * Calculates where edges should be displayed from a list of cube coordinates using the layered cube neighbor discovery algorithm.
 * @param reverseSortedCoordinates - List of cube coordinates, sorted by `(x + y + z)` descendingly.
 * @returns A generator that generates edges to be displayed, edges are represented as tuples of coordinates for start and end points.
 */
function* calculateEdgesLayered(reverseSortedCoordinates: Array<Coordinates>): Generator<[Coordinates, Coordinates], void, number|undefined> {
  // no edges if there are no coordinates, precondition check for getting the first layer number
  if (reverseSortedCoordinates.length === 0) return

  // lower layer number is loaded with the top layer number to populate the layers
  let lowerLayerNumber = reverseSortedCoordinates[0].x + reverseSortedCoordinates[0].y + reverseSortedCoordinates[0].z

  // index of the first unloaded coordinates
  let unloadedIndex = 0
  let higherLayer: Record<string, number> = { }, lowerLayer: Record<string, number> = { }

  // loop over the top layer and assign bitfield representing no adjacent cubes
  // the top layer is the lower layer as it will be promoted when entering the main loop
  while (unloadedIndex < reverseSortedCoordinates.length) {
    const { x, y, z } = reverseSortedCoordinates[unloadedIndex]
    if ((x + y + z) < lowerLayerNumber) {
      lowerLayerNumber = x + y + z
      break
    }

    lowerLayer[`${x} ${y} ${z}`] = 0b111111

    // move on to the next coordinates in the same top layer
    unloadedIndex++
  }

  // the main loop
  // rationale for why this loop will terminate:
  //  - the inner loop has the same condition as the outer loop
  //    so there is no cases where the outer loop continues without going through the inner loop
  //  - the inner loop breaks at most once consecutively
  //    so there is no cases where the inner loop repeatly breaks and makes no progress
  //  - the inner loop increments the index otherwise which will exceed the length eventually
  while (unloadedIndex < reverseSortedCoordinates.length) {
    // promote the lower layer as the higher layer
    higherLayer = lowerLayer
    lowerLayer = { }

    // the inner loop iterates through coordinates on the lower layer
    // and compares them against higher layer by attempted accesses
    while (unloadedIndex < reverseSortedCoordinates.length) {
      const { x, y, z } = reverseSortedCoordinates[unloadedIndex]
      // next layer hit, transfer to outer loop to swap around the layers
      if ((x + y + z) < lowerLayerNumber) {
        lowerLayerNumber = x + y + z
        break
      }

      lowerLayer[`${x} ${y} ${z}`] = 0b111111

      // tag self and the neighbor in the higher layer

      const xNeighbor = higherLayer[`${x + 1} ${y} ${z}`]
      if (xNeighbor !== undefined) {
        lowerLayer[`${x} ${y} ${z}`] &= 0b110111
        higherLayer[`${x + 1} ${y} ${z}`] &= 0b111110
      }

      const yNeighbor = higherLayer[`${x} ${y + 1} ${z}`]
      if (yNeighbor !== undefined) {
        lowerLayer[`${x} ${y} ${z}`] &= 0b101111
        higherLayer[`${x} ${y + 1} ${z}`] &= 0b111101
      }

      const zNeighbor = higherLayer[`${x} ${y} ${z + 1}`]
      if (zNeighbor !== undefined) {
        lowerLayer[`${x} ${y} ${z}`] &= 0b011111
        higherLayer[`${x} ${y} ${z + 1}`] &= 0b111011
      }

      // move on to the next coordinates in the same lower layer
      unloadedIndex++
    }

    // since lower layer will be moved to the higher layer, we can render only higher layer
    for (const [key, inner] of Object.entries(higherLayer)) {
      const [stringX, stringY, stringZ] = key.split(' ')
      yield* calculateCubeEdges({ x: parseInt(stringX), y: parseInt(stringY), z: parseInt(stringZ) }, inner)
    }
  }

  // the lowest layer will not be moved to the higher layer, render it
  for (const [key, inner] of Object.entries(lowerLayer)) {
    const [stringX, stringY, stringZ] = key.split(' ')
    yield* calculateCubeEdges({ x: parseInt(stringX), y: parseInt(stringY), z: parseInt(stringZ) }, inner)
  }
}

/**
 * Calculates where edges should be displayed from coordinates of a cube and a bitfield that represents neighbors.
 * @param coordinates - Coordinates of the cube.
 * @param inner - Bitfield for neighbors, from MSb to LSb: +z, +y, +x, -z, -y, -x. The bit zero if there is a neighbor.
 * @returns A generator that generates edges to be displayed, represents as a tuple of coordinates for start and end points.
 */
function* calculateCubeEdges(coordinates: Coordinates, inner: number): Generator<[Coordinates, Coordinates], void, number|undefined> {
  // if there are no neighbors surrounding an edge, the faces are not obscured, include the edge
  // if there are two neighbors surrounding an edge, this is the corner cube of an L-edge, include the edge
  // if there is just one neighbor, exclude the edge
  const { x, y, z } = coordinates

  const nearestCorner = { x: x + 0.5, y: y + 0.5, z: z + 0.5 }
  // render front prongs
  if ((inner & 0b011000) === 0b011000 || (inner & 0b011000) === 0) yield [nearestCorner, { x: x + 0.5, y: y + 0.5, z: z - 0.5 }]
  if ((inner & 0b101000) === 0b101000 || (inner & 0b101000) === 0) yield [nearestCorner, { x: x + 0.5, y: y - 0.5, z: z + 0.5 }]
  if ((inner & 0b110000) === 0b110000 || (inner & 0b110000) === 0) yield [nearestCorner, { x: x - 0.5, y: y + 0.5, z: z + 0.5 }]

  // render back prongs
  const farthestCorner = { x: x - 0.5, y: y - 0.5, z: z - 0.5 }
  if ((inner & 0b101) === 0b101 || (inner & 0b101) === 0) yield [farthestCorner, { x: x - 0.5, y: y + 0.5, z: z - 0.5 }]
  if ((inner & 0b011) === 0b011 || (inner & 0b011) === 0) yield [farthestCorner, { x: x - 0.5, y: y - 0.5, z: z + 0.5 }]
  if ((inner & 0b110) === 0b110 || (inner & 0b110) === 0) yield [farthestCorner, { x: x + 0.5, y: y - 0.5, z: z - 0.5 }]

  // render outlines
  if ((inner & 0b001100) === 0b001100 || (inner & 0b001100) === 0) yield [{ x: x + 0.5, y: y - 0.5, z: z - 0.5 }, { x: x + 0.5, y: y + 0.5, z: z - 0.5 }]
  if ((inner & 0b001010) === 0b001010 || (inner & 0b001010) === 0) yield [{ x: x + 0.5, y: y - 0.5, z: z - 0.5 }, { x: x + 0.5, y: y - 0.5, z: z + 0.5 }]
  if ((inner & 0b010100) === 0b010100 || (inner & 0b010100) === 0) yield [{ x: x - 0.5, y: y + 0.5, z: z - 0.5 }, { x: x + 0.5, y: y + 0.5, z: z - 0.5 }]
  if ((inner & 0b010001) === 0b010001 || (inner & 0b010001) === 0) yield [{ x: x - 0.5, y: y + 0.5, z: z - 0.5 }, { x: x - 0.5, y: y + 0.5, z: z + 0.5 }]
  if ((inner & 0b100001) === 0b100001 || (inner & 0b100001) === 0) yield [{ x: x - 0.5, y: y - 0.5, z: z + 0.5 }, { x: x - 0.5, y: y + 0.5, z: z + 0.5 }]
  if ((inner & 0b100010) === 0b100010 || (inner & 0b100010) === 0) yield [{ x: x - 0.5, y: y - 0.5, z: z + 0.5 }, { x: x + 0.5, y: y - 0.5, z: z + 0.5 }]
}

export { calculateEdgesMap, calculateEdgesLayered }
