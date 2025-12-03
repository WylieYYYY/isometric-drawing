import type { LineType } from './OrthographicEditorLine.tsx'
import { OrthographicEditorLine } from './OrthographicEditorLine.tsx'
import { updateMinMax } from './../util.ts'

type OrthographicEditorProps = {
  map: Array<Array<LineType>>
  setMap?: (map: Array<Array<LineType>>) => void
}

export function OrthographicEditor({ map, setMap }: OrthographicEditorProps) {
  const background = [], lines = [], minMaxCR = { c: { min: Infinity, max: -Infinity }, r: { min: Infinity, max: -Infinity } }
  for (const [columnIndex, row] of Object.entries(map)) {
    for (const [rowIndex, lineType] of Object.entries(row)) {
      const c = parseInt(columnIndex)
      const r = parseInt(rowIndex)

      if (lineType !== 0) {
        updateMinMax(minMaxCR, { c: Math.floor(c / 2), r })
        updateMinMax(minMaxCR, { c: Math.floor(c / 2) + c % 2, r: r + (1 - c % 2) })
      }

      if (c % 2 === 0 && c !== map.length - 1) {
        background.push(
          <rect
            x={Math.floor(c / 2)} y={r}
            width={1} height={1}
            fill='transparent'
            stroke='lightgray'
            strokeWidth={0.1}
          />
        )
      }

      const lineProps = {
        lineType,
        setLineType: setMap === undefined ? undefined : (lineType: LineType) => {
          const newMap = structuredClone(map)
          newMap[c][r] = lineType
          setMap(newMap)
        },
        start: { x: Math.floor(c / 2), y: r },
        isHorizontal: c % 2 === 1
      }

      lines.push(<OrthographicEditorLine {...lineProps} />)
    }
  }

  const viewBox = `${minMaxCR.c.min - 1} ${minMaxCR.r.min - 1} ${minMaxCR.c.max - minMaxCR.c.min + 2} ${minMaxCR.r.max - minMaxCR.r.min + 2}`

  if (setMap === undefined) return <svg width='100%' height='100%' viewBox={viewBox} data-export-name='orthodraw'>{...lines}</svg>

  return (
    <svg width='100%' height='100%' viewBox={`-1 -1 ${(map.length - 1) / 2 + 2} ${map[0].length + 2}`} data-export-name='orthodraw'>
      {...background}
      {...lines}
    </svg>
  )
}
