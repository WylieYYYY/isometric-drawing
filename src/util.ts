import type { Quaternion } from 'quaternion'
import type { Coordinates } from './IsometricStructure.tsx'
import { Hex } from 'react-hexgrid'

export function hexToPixel(hex: Hex, spacing: number): { x: number, y: number } {
    const x = hex.q * (3 / 2) * 0.1
    const y = (hex.r - hex.s) * (Math.sqrt(3) / 2) * 0.1
    return { x: x * spacing, y: y * spacing }
}

function rotateYClockwise({ x, y, z }: Coordinates): Coordinates {
  return { x: z, y: y, z: -x }
}

function rotateXClockwise({ x, y, z }: Coordinates): Coordinates {
  return { x: x, y: -z, z: y }
}

function rotateZClockwise({ x, y, z }: Coordinates): Coordinates {
  return { x: -y, y: x, z: z }
}

export function rotate(coordinates: Array<Coordinates>, rotation: Quaternion): Array<Coordinates> {
  const [phiRotationAngle, thetaRotationAngle, psiRotationAngle] = rotation.toEuler()
  const YRotationCount = (Math.round(psiRotationAngle / (Math.PI / 2)) + 4) % 4
  const XRotationCount = (Math.round(thetaRotationAngle / (Math.PI / 2)) + 4) % 4
  const ZRotationCount = (Math.round(phiRotationAngle / (Math.PI / 2)) + 4) % 4

  coordinates = coordinates.map(({ x, y, z }) => ({ x: x + 0.5, y: y + 0.5, z: z + 0.5 }))

  for (let rotationsDone = 0; rotationsDone < YRotationCount; rotationsDone++) {
    coordinates = coordinates.map(rotateYClockwise)
  }
  for (let rotationsDone = 0; rotationsDone < XRotationCount; rotationsDone++) {
    coordinates = coordinates.map(rotateXClockwise)
  }
    for (let rotationsDone = 0; rotationsDone < ZRotationCount; rotationsDone++) {
      coordinates = coordinates.map(rotateZClockwise)
    }

  coordinates = coordinates.map(({ x, y, z }) => ({ x: x - 0.5, y: y - 0.5, z: z - 0.5 }))

  return coordinates
}
