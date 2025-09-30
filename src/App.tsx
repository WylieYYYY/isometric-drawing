import { useState } from 'react'
import { GridGenerator, HexGrid, Layout } from 'react-hexgrid'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import { useShallow } from 'zustand/react/shallow'
import { GridPoint } from './GridPoint.tsx'
import { CuboidStructureInputs } from './CuboidStructureInputs.tsx'
import { IsometricStructure } from './IsometricStructure.tsx'
import { useStore } from './Store.tsx'

function downloadSVG(setDownloadUrl: (downloadUrl: string) => void) {
  const BLOB_URL_TIMEOUT = 500

  const svg = document.querySelector('svg')!
  const anchor = document.getElementById('download') as HTMLAnchorElement

  anchor.download = 'export.svg'
  const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' })
  setDownloadUrl(URL.createObjectURL(blob))
  setTimeout(() => anchor.click(), BLOB_URL_TIMEOUT)
}

function App() {
  const [
    rotateXClockwise,
    rotateXAnticlockwise,
    rotateYClockwise,
    rotateYAnticlockwise,
    rotateZClockwise,
    rotateZAnticlockwise
  ] = useStore(useShallow((state) => [
    state.rotateXClockwise,
    state.rotateXAnticlockwise,
    state.rotateYClockwise,
    state.rotateYAnticlockwise,
    state.rotateZClockwise,
    state.rotateZAnticlockwise
  ]))

  const [downloadUrl, setDownloadUrl] = useState('#')

  const generator = GridGenerator.hexagon(20)

  return (
    <>
      <a id='download' href={downloadUrl} style={{ display: 'none' }}></a>
      <TransformWrapper centerOnInit={true} initialScale={8}>
        <TransformComponent wrapperStyle={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 1000, height: 1000 }}>
            <HexGrid viewBox='-20 -20 40 40'>
              <Layout size={{ x: 0.1, y: 0.1 }} spacing={4}>
                {
                  generator.map((hex, key) => (
                    <GridPoint
                      key={key}
                      hex={hex}
                      spacing={4}
                      radius={0.05}
                    />
                  ))
                }
                <IsometricStructure />
              </Layout>
            </HexGrid>
          </div>
        </TransformComponent>
      </TransformWrapper>
      <div style={{ position: 'fixed', left: '.5em', top: '2em' }}>
        <CuboidStructureInputs />
      </div>
      <div style={{ position: 'fixed', left: '.5em', bottom: '2em' }}>
        <button onClick={() => downloadSVG(setDownloadUrl)}>
          Export SVG
        </button>
      </div>
      <div style={{ position: 'fixed', right: '.5em', bottom: '2em', display: 'flex', flexDirection: 'column' }}>
        <button onClick={rotateXClockwise}>Rotate about positive x (→x)</button>
        <button onClick={rotateXAnticlockwise}>Rotate about negative x (←x)</button>
        <button onClick={rotateYClockwise}>Rotate about positive y (→y)</button>
        <button onClick={rotateYAnticlockwise}>Rotate about negative y (←y)</button>
        <button onClick={rotateZClockwise}>Rotate about positive z (→z)</button>
        <button onClick={rotateZAnticlockwise}>Rotate about negative z (←z)</button>
      </div>
    </>
  )
}

export default App
