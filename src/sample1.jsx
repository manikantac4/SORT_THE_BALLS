import React, { useRef, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Points, PointMaterial, Stars } from "@react-three/drei"
import * as THREE from "three"


/* ================= ENERGY FLOW SYSTEM ================= */

function EnergyFlow() {

  const ref = useRef()
  const count = 5000


  /* ---------- SHAPE GENERATION ---------- */

  const shapes = useMemo(() => {

    const tunnel = new Float32Array(count * 3)
    const sphere = new Float32Array(count * 3)
    const galaxySphere = new Float32Array(count * 3)
    const noiseSphere = new Float32Array(count * 3)
    const shellSphere = new Float32Array(count * 3)
    const torus = new Float32Array(count * 3)
    const random = new Float32Array(count * 3)

    const colors = new Float32Array(count * 3)

    const color1 = new THREE.Color("#00f2ff")
    const color2 = new THREE.Color("#7000ff")


    for (let i = 0; i < count; i++) {

      const i3 = i * 3


      /* ---------- TUNNEL ---------- */

      const theta = Math.random() * Math.PI * 2
      const radius = Math.random() * 6 + 2

      tunnel[i3] = Math.cos(theta) * radius
      tunnel[i3 + 1] = Math.sin(theta) * radius
      tunnel[i3 + 2] = (Math.random() - 0.5) * 60



      /* ---------- PERFECT SPHERE ---------- */

      const phi = Math.acos(-1 + (2 * i) / count)
      const thetaSphere = Math.sqrt(count * Math.PI) * phi

      const r = 5

      sphere[i3] = r * Math.cos(thetaSphere) * Math.sin(phi)
      sphere[i3 + 1] = r * Math.sin(thetaSphere) * Math.sin(phi)
      sphere[i3 + 2] = r * Math.cos(phi)



      /* ---------- GALAXY SPHERE ---------- */

      const spiral = i * 0.1
      const spiralRadius = 5 + Math.sin(i * 0.05)

      galaxySphere[i3] = spiralRadius * Math.cos(spiral)
      galaxySphere[i3 + 1] = spiralRadius * Math.sin(spiral)
      galaxySphere[i3 + 2] = (i / count - 0.5) * 12



      /* ---------- NOISE SPHERE ---------- */

      const noise = 5 + Math.sin(i * 0.3) * Math.cos(i * 0.2)

      noiseSphere[i3] = noise * Math.cos(thetaSphere) * Math.sin(phi)
      noiseSphere[i3 + 1] = noise * Math.sin(thetaSphere) * Math.sin(phi)
      noiseSphere[i3 + 2] = noise * Math.cos(phi)



      /* ---------- SHELL SPHERE ---------- */

      const shellRadius = 6

      shellSphere[i3] = shellRadius * Math.cos(thetaSphere) * Math.sin(phi)
      shellSphere[i3 + 1] = shellRadius * Math.sin(thetaSphere) * Math.sin(phi)
      shellSphere[i3 + 2] = shellRadius * Math.cos(phi)



      /* ---------- TORUS (RING FORMATION) ---------- */

      const major = 6
      const minor = 2

      const u = Math.random() * Math.PI * 2
      const v = Math.random() * Math.PI * 2

      torus[i3] =
        (major + minor * Math.cos(v)) * Math.cos(u)

      torus[i3 + 1] =
        (major + minor * Math.cos(v)) * Math.sin(u)

      torus[i3 + 2] =
        minor * Math.sin(v)



      /* ---------- EXPLOSION ---------- */

      random[i3] = (Math.random() - 0.5) * 100
      random[i3 + 1] = (Math.random() - 0.5) * 100
      random[i3 + 2] = (Math.random() - 0.5) * 100



      /* ---------- COLOR GRADIENT ---------- */

      const mixed = color1.clone().lerp(color2, Math.random())

      colors[i3] = mixed.r
      colors[i3 + 1] = mixed.g
      colors[i3 + 2] = mixed.b

    }


    return {
      tunnel,
      sphere,
      galaxySphere,
      noiseSphere,
      shellSphere,
      torus,
      random,
      colors
    }

  }, [count])



  /* ---------- ANIMATION ---------- */

  useFrame((state) => {

    const time = state.clock.getElapsedTime()

    const cycle = time % 24

    const positions =
      ref.current.geometry.attributes.position.array


    let target = shapes.tunnel
    let speed = 0.05


    if (cycle < 4) {

      target = shapes.tunnel

    }

    else if (cycle < 8) {

      target = shapes.sphere
      speed = 0.08

    }

    else if (cycle < 12) {

      target = shapes.galaxySphere
      speed = 0.06

    }

    else if (cycle < 15) {

      target = shapes.noiseSphere
      speed = 0.05

    }

    else if (cycle < 18) {

      target = shapes.shellSphere
      speed = 0.05

    }

    else if (cycle < 21) {

      target = shapes.torus
      speed = 0.06

    }

    else {

      target = shapes.random
      speed = 0.02

    }



    /* morph */

    for (let i = 0; i < count * 3; i++) {

      positions[i] =
        THREE.MathUtils.lerp(
          positions[i],
          target[i],
          speed
        )

    }


    ref.current.geometry.attributes.position.needsUpdate = true



    /* opacity pulse */

    ref.current.material.opacity =
      0.5 + Math.sin(time * 2) * 0.25



    /* rotation */

    ref.current.rotation.y = time * 0.15
    ref.current.rotation.x = time * 0.05
    ref.current.rotation.z = time * 0.02

  })



  return (

    <Points
      ref={ref}
      positions={shapes.tunnel}
      colors={shapes.colors}
      stride={3}
    >

      <PointMaterial
        transparent
        vertexColors
        size={0.12}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />

    </Points>

  )

}



/* ================= MAIN BACKGROUND ================= */

export default function SpaceEnergyBackground() {

  return (

    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        zIndex: -1
      }}
    >

      <Canvas camera={{ position: [0, 0, 30], fov: 60 }}>

        <color attach="background" args={["#000003"]} />

        <Stars
          radius={100}
          depth={50}
          count={4000}
          factor={4}
          fade
          speed={1}
        />

        <EnergyFlow />

        <fog attach="fog" args={["#000003", 10, 80]} />

      </Canvas>

    </div>

  )

}
