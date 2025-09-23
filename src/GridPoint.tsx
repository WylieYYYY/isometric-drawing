import type { CSSProperties, MouseEvent } from 'react'
import { useState } from 'react'
import { Hex, Hexagon } from 'react-hexgrid'

type HandlerProps = {
  data?: { setSelectedFill: () => void }
  state: { hex: Hex }
  props: unknown
}

type GridPointProps = {
  hex: Hex
  unselectedFill: string
  selectedFill: string
}

function handleClick(
  _event: MouseEvent<SVGGElement, globalThis.MouseEvent>,
  props: HandlerProps
) {
  props.data!.setSelectedFill()
}

export function GridPoint({ hex, unselectedFill, selectedFill }: GridPointProps) {
  const [fill, setFill] = useState(unselectedFill)

  return (
    <Hexagon
      q={hex.q}
      r={hex.r}
      s={hex.s}
      data={{ setSelectedFill: () => setFill(selectedFill) }}
      fill={fill}
      onClick={handleClick}
      style={{ pointerEvents: 'bounding-box' as CSSProperties['pointerEvents'] }}
    />
  )
}
