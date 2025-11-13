import type { SVGAttributes } from 'react'
import { useState } from 'react'
import { useStore } from './../Store.tsx'
import { joinedEndsSVGLineCoordinatesProps } from './../util.ts'

export type LineType = 0 | 1 | 2

type OrthographicEditorLineProps = {
  isInteractive: boolean
  lineType: LineType
  setLineType: (lineType: LineType) => void
  start: { x: number, y: number }
  isHorizontal: boolean
}

export function OrthographicEditorLine({ isInteractive, lineType, setLineType, start, isHorizontal }: OrthographicEditorLineProps) {
  const supportsHover = useStore((state) => state.supportsHover)

  const [isHighlighted, setIsHighlighted] = useState(false)

  const lineProps: Record<'regular'|'highlighted', Array<SVGAttributes<SVGLineElement>>> = { regular: [], highlighted: [] }
  switch (lineType) {
    case 0:
      lineProps.regular = []
      lineProps.highlighted = [{ stroke: 'limegreen', strokeOpacity: 0.5 }]
      break
    case 1:
      lineProps.regular = [{ stroke: 'black' }]
      lineProps.highlighted = [
        { stroke: 'black', strokeDasharray: '0.2' },
        { stroke: 'red', strokeOpacity: 0.5, strokeDasharray: '0.2', strokeDashoffset: 0.2 }
      ]
      break
    case 2:
      lineProps.regular = [{ stroke: 'black', strokeDasharray: '0.2' }]
      lineProps.highlighted = [{ stroke: 'red', strokeOpacity: 0.5, strokeDasharray: '0.2' }]
      break
  }

  const STROKE_WIDTH = 0.1
  const coordinatesProps = joinedEndsSVGLineCoordinatesProps(1, STROKE_WIDTH, isHorizontal, start.x, start.y)

  const chosenStateLineProps = supportsHover && isHighlighted ? lineProps.highlighted : lineProps.regular

  return (
    <>
      {
        chosenStateLineProps.map((props) => {
          return <line {...coordinatesProps} strokeWidth={STROKE_WIDTH} {...props} />
        })
      }
      {
        isInteractive ? (
          <line
            {...coordinatesProps}
            strokeWidth={STROKE_WIDTH}
            stroke='transparent'
            onClick={() => setLineType((lineType + 1) % 3 as LineType)}
            onMouseOver={() => setIsHighlighted(true)}
            onMouseOut={() => setIsHighlighted(false)}
          />
        ) : null
      }
    </>
  )
}
