import type { Quaternion } from 'quaternion'
import type { Coordinates, Direction } from './isometric/foreground/IsometricStructure.tsx'
import { Hex, HexUtils } from 'react-hexgrid'

type CoordinatesLike = Coordinates & Record<string | number | symbol, unknown>

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
 * Rotates 90 degrees clockwise around y-axis (positive y), origin perspective.
 * @param coordinatesLike - Coordinates that may have auxiliary data attached to them, like a cube location.
 * @returns The rotated coordinates combined with the unchanged auxiliary data.
 */
function rotateYClockwise({ x, y, z, ...rest }: CoordinatesLike): CoordinatesLike {
  return { x: z, y: y, z: -x, ...rest }
}

/**
 * Rotates 90 degrees clockwise around x-axis (positive x), origin perspective.
 * @param coordinatesLike - Coordinates that may have auxiliary data attached to them, like a cube location.
 * @returns The rotated coordinates combined with the unchanged auxiliary data.
 */
function rotateXClockwise({ x, y, z, ...rest }: CoordinatesLike): CoordinatesLike {
  return { x: x, y: -z, z: y, ...rest }
}

/**
 * Rotates 90 degrees clockwise around z-axis (positive z), origin perspective.
 * @param coordinatesLike - Coordinates that may have auxiliary data attached to them, like a cube location.
 * @returns The rotated coordinates combined with the unchanged auxiliary data.
 */
function rotateZClockwise({ x, y, z, ...rest }: CoordinatesLike): CoordinatesLike {
  return { x: -y, y: x, z: z, ...rest }
}

/**
 * Rotates coordinates with the given quaternion rotation.
 * @param coordinates - Array of coordinates that may have auxiliary data attached to them, like a cube location.
 * @returns The rotated array of coordinates combined with the unchanged auxiliary data.
 */
export function rotate(coordinates: Array<CoordinatesLike>, rotation: Quaternion): Array<CoordinatesLike> {
  // converts the quaternion into euler angles (Tait-Bryan formalism), then to discrete rotations
  // anticlockwise rotations are emulated with clockwise rotations
  const [phiRotationAngle, thetaRotationAngle, psiRotationAngle] = rotation.toEuler()
  const YRotationCount = (Math.round(psiRotationAngle / (Math.PI / 2)) + 4) % 4
  const XRotationCount = (Math.round(thetaRotationAngle / (Math.PI / 2)) + 4) % 4
  const ZRotationCount = (Math.round(phiRotationAngle / (Math.PI / 2)) + 4) % 4

  // offset by 0.5 so that the rotation will be around the axes and not cubes
  coordinates = coordinates.map(({ x, y, z, ...rest }) => ({ x: x + 0.5, y: y + 0.5, z: z + 0.5, ...rest }))

  // phi, theta and psi are Z, X and Y respectively
  // since they are in the order of matrix multiplication, the rotation is applied right-to-left
  for (let rotationsDone = 0; rotationsDone < YRotationCount; rotationsDone++) {
    coordinates = coordinates.map(rotateYClockwise)
  }
  for (let rotationsDone = 0; rotationsDone < XRotationCount; rotationsDone++) {
    coordinates = coordinates.map(rotateXClockwise)
  }
  for (let rotationsDone = 0; rotationsDone < ZRotationCount; rotationsDone++) {
    coordinates = coordinates.map(rotateZClockwise)
  }

  // undo the offset above
  coordinates = coordinates.map(({ x, y, z, ...rest }) => ({ x: x - 0.5, y: y - 0.5, z: z - 0.5, ...rest }))

  return coordinates
}
