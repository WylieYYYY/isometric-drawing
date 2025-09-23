import { GridGenerator, HexGrid, Layout } from 'react-hexgrid'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import { GridPoint } from './GridPoint.tsx'

function App() {
  const generator = GridGenerator.hexagon(20)

  return (
    <>
      <TransformWrapper centerOnInit={true} initialScale={8}>
        <TransformComponent wrapperStyle={{ width: '100%' }}>
          <HexGrid style={{ width: 1000, height: 1000 }}>
            <Layout size={{ x: 0.1, y: 0.1 }} spacing={4}>
              <defs>
                <radialGradient id='unselectedFill'>
                  <stop offset='100%' stopColor='gray' />
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
            </Layout>
          </HexGrid>
        </TransformComponent>
      </TransformWrapper>
    </>
  )
}

export default App
