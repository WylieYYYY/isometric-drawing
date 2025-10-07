import type { Quaternion } from 'quaternion'
import type { Coordinates } from './IsometricStructure.tsx'
import { Hex } from 'react-hexgrid'

type CoordinatesLike = Coordinates & Record<string | number | symbol, unknown>

export function hexToPixel(hex: Hex, spacing: number): { x: number, y: number } {
    const x = hex.q * (3 / 2) * 0.1
    const y = (hex.r - hex.s) * (Math.sqrt(3) / 2) * 0.1
    return { x: x * spacing, y: y * spacing }
}

function rotateYClockwise({ x, y, z, ...rest }: CoordinatesLike): CoordinatesLike {
  return { x: z, y: y, z: -x, ...rest }
}

function rotateXClockwise({ x, y, z, ...rest }: CoordinatesLike): CoordinatesLike {
  return { x: x, y: -z, z: y, ...rest }
}

function rotateZClockwise({ x, y, z, ...rest }: CoordinatesLike): CoordinatesLike {
  return { x: -y, y: x, z: z, ...rest }
}

export function rotate(coordinates: Array<CoordinatesLike>, rotation: Quaternion): Array<CoordinatesLike> {
  const [phiRotationAngle, thetaRotationAngle, psiRotationAngle] = rotation.toEuler()
  const YRotationCount = (Math.round(psiRotationAngle / (Math.PI / 2)) + 4) % 4
  const XRotationCount = (Math.round(thetaRotationAngle / (Math.PI / 2)) + 4) % 4
  const ZRotationCount = (Math.round(phiRotationAngle / (Math.PI / 2)) + 4) % 4

  coordinates = coordinates.map(({ x, y, z, ...rest }) => ({ x: x + 0.5, y: y + 0.5, z: z + 0.5, ...rest }))

  for (let rotationsDone = 0; rotationsDone < YRotationCount; rotationsDone++) {
    coordinates = coordinates.map(rotateYClockwise)
  }
  for (let rotationsDone = 0; rotationsDone < XRotationCount; rotationsDone++) {
    coordinates = coordinates.map(rotateXClockwise)
  }
  for (let rotationsDone = 0; rotationsDone < ZRotationCount; rotationsDone++) {
    coordinates = coordinates.map(rotateZClockwise)
  }

  coordinates = coordinates.map(({ x, y, z, ...rest }) => ({ x: x - 0.5, y: y - 0.5, z: z - 0.5, ...rest }))

  return coordinates
}
