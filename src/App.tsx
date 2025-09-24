import { GridGenerator, HexGrid, Layout } from 'react-hexgrid'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import { useShallow } from 'zustand/react/shallow'
import { GridPoint } from './GridPoint.tsx'
import { IsometricStructure } from './IsometricStructure.tsx'
import { useStore } from './Store.tsx'

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

  const generator = GridGenerator.hexagon(20)

  return (
    <>
      <TransformWrapper centerOnInit={true} initialScale={8}>
        <TransformComponent wrapperStyle={{ width: '100%' }}>
          <HexGrid style={{ width: 1000, height: 1000 }}>
            <Layout size={{ x: 0.1, y: 0.1 }} spacing={4}>
              <defs>
                <radialGradient id='unselectedFill'>
                  <stop offset='100%' stopColor='black' />
                </radialGradient>
                <radialGradient id='selectedFill'>
                  <stop offset='100%' stopColor='red' />
                </radialGradient>
              </defs>
              {
                generator.map((hex, key) => (
                  <GridPoint
                    key={key}
                    hex={hex}
                    unselectedFill='unselectedFill'
                    selectedFill='selectedFill'
                  />
                ))
              }
              <IsometricStructure />
            </Layout>
          </HexGrid>
        </TransformComponent>
      </TransformWrapper>
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
