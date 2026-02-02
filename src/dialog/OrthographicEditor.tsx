import type { LineType } from './OrthographicEditorLine.tsx'
import { OrthographicEditorLine } from './OrthographicEditorLine.tsx'
import { updateMinMax } from './../util.ts'

export type OrthographicEditorProps = {
  /**
   * Map of lines in an orthographic drawing.
   * Arrays of lines at odd indices represent vertical lines.
   * Arrays of lines at even indices represent horizontal lines.
   * Those arrays specify the lines from top to bottom.
   * So, a 2x2 grid will have inner arrays of sizes [2, 3, 2, 3, 2].
   */
  map: Array<Array<LineType>>
  /**
   * Sets the map of lines in an orthographic drawing.
   * @param map - The new value.
   */
  setMap?: (map: Array<Array<LineType>>) => void
}

/** Editor that allows orthographic drawings to be produced by drawing lines by hand. */
export function OrthographicEditor({ map, setMap }: OrthographicEditorProps) {
  const background = [], lines = [], minMaxCR = { c: { min: Infinity, max: -Infinity }, r: { min: Infinity, max: -Infinity } }
  for (const [columnIndex, row] of Object.entries(map)) {
    for (const [rowIndex, lineType] of Object.entries(row)) {
      const c = parseInt(columnIndex)
      const r = parseInt(rowIndex)

      // if the line is visible, update the boundary of the drawn lines
      if (lineType !== 0) {
        // account for start of the line
        updateMinMax(minMaxCR, { c: Math.floor(c / 2), r })
        // account for end of the line, can extend downward or rightward
        updateMinMax(minMaxCR, { c: Math.floor(c / 2) + c % 2, r: r + (1 - c % 2) })
      }

      // background sqaures to draw on, one square every two line columns
      // this has acceptable overlapping renders
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
        // only allow setting lines if the map can be set
        // reconstructs the map with the line type changed
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

  // view box of the drawing cropped to its boundary of the drawn lines
  const viewBox = `${minMaxCR.c.min - 1} ${minMaxCR.r.min - 1} ${minMaxCR.c.max - minMaxCR.c.min + 2} ${minMaxCR.r.max - minMaxCR.r.min + 2}`

  // if the map is not changeable then the image should be cropped for display or export
  if (setMap === undefined) return <svg width='100%' height='100%' viewBox={viewBox} data-export-name='orthodraw'>{...lines}</svg>

  // otherwise show background and the full extent
  // `data-export-name` is not required here as the drawing should not be exported in this state
  return (
    <svg width='100%' height='100%' viewBox={`-1 -1 ${(map.length - 1) / 2 + 2} ${map[0].length + 2}`} data-export-name='orthodraw'>
      {...background}
      {...lines}
    </svg>
  )
}
