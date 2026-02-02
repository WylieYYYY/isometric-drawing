import type { Quaternion } from 'quaternion'
import type { SVGAttributes } from 'react'
import type { Coordinates, Direction, PositiveAxis } from './drawing/isometric/foreground/IsometricStructure.tsx'
import { Hex, HexUtils } from 'react-hexgrid'

/** Coordinates that have extra keys which are ignored by the functions operating on them. */
export type CoordinatesLike = Coordinates & Record<string | number | symbol, unknown>

/**
 * Updates an accumulator of minimum and maximum values with a new value in place.
 * For example, let the accumulator be { attr1: { min: Infinity, max: -Infinity }, attr2: { min: 1, max: 9 } } and
 * let the values be { attr1: 5, attr2: 10 }.
 * The accumulator will then be updated to { attr1: { min: 5, max: 5 }, attr2: { min: 1, max: 10 } }.
 * @param accMinMax - The accumulator.
 * @param values - The new values to be compared against.
 */
export function updateMinMax<Key extends string|number|symbol>(
  accMinMax: Record<Key, { min: number, max: number }>,
  values: Record<Key, number>
) {
  for (const [key, value] of Object.entries<number>(values)) {
    accMinMax[key as Key] = {
      min: Math.min(accMinMax[key as Key].min, value),
      max: Math.max(accMinMax[key as Key].max, value)
    }
  }
}

/**
 * Makes a two dimensional array by flattening coordinates on an axis into sets, and using the other axes as indices.
 * If x-axis is flattened, then the map will have [z][y] as indices. (This does not follow alphabetical order)
 * If y-axis is flattened, then the map will have [x][z] as indices.
 * If z-axis is flattened, then the map will have [x][y] as indices.
 * @param flattenAxis - Axis to be flattened into sets.
 * @param coordinates - Coordinates to create map from.
 * @returns A tuple of sparse array that represents a map of coordinate sets and the limits of the map.
 */
export function coordinatesMap(
  flattenAxis: PositiveAxis,
  coordinates: Array<Coordinates>
): [Array<Array<Set<number>>>, Record<PositiveAxis, { min: number, max: number }>] {
  // using xzy is intentional as this allows orthographic views to use this function without rotating axes
  const [firstAxis, secondAxis] = ['x', 'z', 'y'].filter((axis) => axis !== flattenAxis) as Array<PositiveAxis>

  const minMaxCoordinates = {
    [firstAxis]: { min: Infinity, max: -Infinity },
    [secondAxis]: { min: Infinity, max: -Infinity }
  }

  const map: Array<Array<Set<number>>> = []

  for (const xyz of coordinates) {
    // create elements sparsely, calculations depends on this behavior to check if there are adjacent columns
    map[xyz[firstAxis]] = map[xyz[firstAxis]] ?? []
    map[xyz[firstAxis]][xyz[secondAxis]] = map[xyz[firstAxis]][xyz[secondAxis]] ?? new Set()
    map[xyz[firstAxis]][xyz[secondAxis]].add(xyz[flattenAxis])

    updateMinMax(minMaxCoordinates, { [firstAxis]: xyz[firstAxis], [secondAxis]: xyz[secondAxis] })
  }

  return [map, minMaxCoordinates as Record<PositiveAxis, { min: number, max: number }>]
}

/**
 * This converts hex to pixel coordinates, similar to the function of the same name in react-hexgrid.
 * No internal layouting variable is required and improves readability.
 * @param hex - Hex to be converted.
 * @param spacing - Spacing as specified in react-hexgrid.
 * @returns The pixel coordinates.
 */
export function hexToPixel(hex: Hex, spacing: number): { x: number, y: number } {
  // following the convension in react-hexgrid:
  // the grid points are sqrt(3) units apart
  // results of the calculation is multiplied by 0.1 * spacing

  // see https://www.redblobgames.com/grids/hexagons/ for calculation
  const x = hex.q * (3 / 2) * 0.1
  const y = (hex.r * Math.sqrt(3) + hex.q * (Math.sqrt(3) / 2)) * 0.1

  return { x: x * spacing, y: y * spacing }
}

/**
 * Constructs a hex which is in the given direction and distance from origin.
 * @param direction - Direction from origin.
 * @param distance - Distance from origin.
 * @returns The hex.
 */
export function directionalHex(direction: Direction, distance: number): Hex {
  return HexUtils.multiply(HexUtils.direction(direction), distance)
}

/**
 * Rotates coordinates with the given quaternion rotation.
 * @param coordinates - Array of coordinates that may have auxiliary data attached to them, like a cube location.
 * @returns The rotated array of coordinates combined with the unchanged auxiliary data.
 */
export function rotate(coordinates: Array<CoordinatesLike>, rotation: Quaternion): Array<CoordinatesLike> {
  const rotatedCoordinates = []

  for (const { x, y, z, ...rest } of coordinates) {
    // offset by 0.5 so that the rotation will be around the axes and not cubes
    const { x: rotatedX, y: rotatedY, z: rotatedZ } = rotation.rotateVector({ x: x + 0.5, y: y + 0.5, z: z + 0.5 }) as { x: number, y: number, z: number }
    // undo the offset above
    rotatedCoordinates.push({ x: Math.round(rotatedX - 0.5), y: Math.round(rotatedY - 0.5), z: Math.round(rotatedZ - 0.5), ...rest })
  }

  return rotatedCoordinates
}

/**
 * Draws a line from the given coordinates rightward or downward with the given length.
 * Accounts for stroke width so that the lines join without missing corner.
 * @param length - The length of the line.
 * @param strokeWidth - The width of the line.
 * @param isHorizontal - True if the line should extend rightward, false to extend downward.
 * @param x - X-coordinate to start the line with.
 * @param y - Y-coordinate to start the line with.
 * @returns SVG line element attributes that define the start and end of the line (x1, x2, y1, y2).
 */
export function joinedEndsSVGLineCoordinatesProps(
  length: number,
  strokeWidth: number,
  isHorizontal: boolean,
  x: number,
  y: number
): SVGAttributes<SVGLineElement> {
  // account for stroke width so that the lines join without missing corner
  const x1 = isHorizontal ? x - strokeWidth / 2 : x
  const x2 = isHorizontal ? x + length + strokeWidth / 2 : x
  const y1 = isHorizontal ? y : y - strokeWidth / 2
  const y2 = isHorizontal ? y : y + length + strokeWidth / 2

  return { x1, x2, y1, y2 }
}
