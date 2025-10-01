import { Hex } from 'react-hexgrid'

export function hexToPixel(hex: Hex, spacing: number): { x: number, y: number } {
    const x = hex.q * (3 / 2) * 0.1
    const y = (hex.r - hex.s) * (Math.sqrt(3) / 2) * 0.1
    return { x: x * spacing, y: y * spacing }
}
