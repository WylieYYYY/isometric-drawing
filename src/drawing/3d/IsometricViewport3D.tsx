import type { ReactNode } from 'react'
import type { RootState } from '@react-three/fiber'
import type { InstancedMesh, Object3D } from 'three'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { cubeLocationFromCuboidValues, useDrawingStore } from './../DrawingStoreHook.ts'
import { calculateEdgesMap } from './Renderer3D.ts'

export type IsometricViewport3DProps = {
  /** Placeholder node to use while the libraries are loading. */
  placeholder?: ReactNode
}

type DynamicImports = {
  drei: typeof import('@react-three/drei'),
  fiber: typeof import('@react-three/fiber'),
  three: typeof import('three')
}

/**
 * An aggregate of all grid points for instanced rendering
 * as there are a large number of them.
 */
function GridPoints({ three }: Pick<DynamicImports, 'three'>) {
  const meshRef = useRef<InstancedMesh|null>(null)

  useLayoutEffect(() => {
    let i = 0

    // the default grid helper is 11x11 centered at origin, put points all over it
    for (let x = -5; x <= 5; x++) {
      for (let y = -5; y <= 5; y++) {
        for (let z = -5; z <= 5; z++) {
          const matrix = new three.Matrix4()
          matrix.setPosition(x, y, z)
          meshRef.current!.setMatrixAt(i++, matrix)
        }
      }
    }
  }, [three.Matrix4])

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 11 * 11 * 11]}>
      <sphereGeometry args={[0.05, 16, 8]} />
      <meshBasicMaterial color='black' opacity={0.2} transparent={true} />
    </instancedMesh>
  )
}

/**
 * Group of the entire structure.
 * This allows the rotation of the entire structure at once.
 */
function GroupObject({ three, fiber }: Pick<DynamicImports, 'three' | 'fiber'>) {
  const objectRef = useRef<Object3D|null>(null)

  const cuboidValues = useDrawingStore((state) => state.cuboidValues)
  const rotation = useDrawingStore((state) => state.rotation)

  // two quaternion implementations are incompatible, cast to the Three.js version
  const threeJsRotation = new three.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w)

  // rotate smoothly towards the target rotation every frame
  fiber.useFrame(() => {
    objectRef.current!.quaternion.rotateTowards(threeJsRotation, Math.PI / 30)
  })

  const edges = []
  for (const [start, end] of calculateEdgesMap(cubeLocationFromCuboidValues(cuboidValues))) {
    // the mesh needs to be offset as the position uses the center as anchor
    // offset by 0.5 as the coordinates systems differ
    // `max` and `abs` as two axes will be zero size for an edge, set that to 0.05
    edges.push(
      <mesh position={[(start.x + end.x) / 2 + 0.5, (start.y + end.y) / 2 + 0.5, (start.z + end.z) / 2 + 0.5]}>
        <boxGeometry
          args={[
            Math.max(Math.abs(start.x - end.x), 0.05),
            Math.max(Math.abs(start.y - end.y), 0.05),
            Math.max(Math.abs(start.z - end.z), 0.05)
          ]}
        />
        <meshBasicMaterial color='black' />
      </mesh>
    )
  }

  return (
    <object3D ref={objectRef}>
      {
        // offset by 0.5 as the coordinates systems differ
        // each cuboid is rendered by one box
        // need to convert cuboid to cube if individual cube highlighting is added
        // add 0.01 to cover the protruding edges
        cuboidValues.map((cuboidValue) => {
          const { x, y, z, dx, dy, dz } = cuboidValue
          return (
            <mesh position={[x + dx / 2, y + dy / 2, z + dz / 2]}>
              <boxGeometry args={[dx + 0.01, dy + 0.01, dz + 0.01]} />
              <meshBasicMaterial color='white' />
            </mesh>
          )
        })
      }
      {edges}
    </object3D>
  )
}

/**
 * Viewport that contains everything that is considered a part of an isometric drawing.
 * This is the 3-dimensional version of `IsometricViewport`.
 *
 * Screenshot:
 *
 * ![screenshot](screenshots/IsometricViewport3D.png)
 */
export function IsometricViewport3D({ placeholder }: IsometricViewport3DProps) {
  const [
    shouldShowIsometricGrid,
    shouldShowAxisArrows,
    shouldShowIsometricStructure
  ] = useDrawingStore(useShallow((state) => [
    state.shouldShowIsometricGrid,
    state.shouldShowAxisArrows,
    state.shouldShowIsometricStructure
  ]))

  const [rootState, setRootState] = useState<RootState|null>(null)

  const [dynamicImports, setDynamicImports] = useState<DynamicImports|null>(null)

  useEffect(() => {
    (async () => {
      const drei = await import('@react-three/drei')
      const fiber = await import('@react-three/fiber')
      const three = await import('three')
      setDynamicImports({ drei, fiber, three })
    })()
  }, [])

  if (dynamicImports === null) return placeholder

  const { GizmoHelper, GizmoViewport, OrbitControls } = dynamicImports.drei
  const { Canvas } = dynamicImports.fiber

  return (
    <>
      <div>
        <button onClick={() => rootState!.camera.position.set(10, 10, 10)}>
          Reset camera
        </button>
      </div>
      <Canvas
        camera={{ position: [10, 10, 10], zoom: 40 }}
        orthographic={true}
        linear flat onCreated={setRootState}
      >
        <gridHelper />
        <OrbitControls enableDamping={false} />
        {shouldShowIsometricGrid ? <GridPoints three={dynamicImports.three} /> : null}
        {
          shouldShowIsometricStructure ? (
            <GroupObject fiber={dynamicImports.fiber} three={dynamicImports.three} />
          ) : null
        }
        {
          shouldShowAxisArrows ? (
            <GizmoHelper alignment='bottom-left'>
              <GizmoViewport
                disabled={true}
                axisColors={['red', 'green', 'blue']}
                labelColor='black'
              />
            </GizmoHelper>
          ) : null
        }
      </Canvas>
    </>
  )
}
