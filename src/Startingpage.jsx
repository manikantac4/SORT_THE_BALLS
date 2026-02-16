import React, { useRef, useMemo, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Points, PointMaterial } from "@react-three/drei"
import * as THREE from "three"
import { useNavigate } from "react-router-dom"



/* ================= SPARKLE BACKGROUND ================= */
function DeepSpaceStars() {

  const nearRef = useRef()
  const midRef = useRef()
  const farRef = useRef()

  // increased counts for better distribution
  const nearCount = 1400
  const midCount = 2400
  const farCount = 2200



  function createLayer(count, spread, speedMax) {

    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)

    for (let i = 0; i < count; i++) {

      const i3 = i * 3

      // wider area
      positions[i3] = (Math.random() - 0.5) * spread
      positions[i3 + 1] = (Math.random() - 0.5) * spread
      positions[i3 + 2] = (Math.random() - 0.5) * spread

      // mix static and moving
      speeds[i] =
        Math.random() < 0.4
          ? 0
          : Math.random() * speedMax

    }

    return { positions, speeds }

  }



  // much wider spread areas
  const near = useMemo(() => createLayer(nearCount, 200, 0.015), [])
  const mid = useMemo(() => createLayer(midCount, 300, 0.008), [])
  const far = useMemo(() => createLayer(farCount, 400, 0.003), [])



  useFrame((state) => {

    const t = state.clock.getElapsedTime()

    function animate(ref, layer, sparkleSpeed) {

      const positions =
        ref.current.geometry.attributes.position.array

      for (let i = 0; i < layer.speeds.length; i++) {

        const speed = layer.speeds[i]

        if (speed !== 0) {

          const i3 = i * 3

          positions[i3 + 1] += speed

          if (positions[i3 + 1] > 200)
            positions[i3 + 1] = -200

        }

      }

      ref.current.geometry.attributes.position.needsUpdate = true

      // sparkle intensity
      ref.current.material.opacity =
        0.65 + Math.sin(t * sparkleSpeed) * 0.35

    }



    animate(farRef, far, 0.5)
    animate(midRef, mid, 1.0)
    animate(nearRef, near, 1.8)

  })



  return (

    <>

      {/* FAR stars (small) */}
      <Points ref={farRef} positions={far.positions} stride={3}>
        <PointMaterial
          transparent
          color="#66ffaa"
          size={0.05}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>


      {/* MID stars (medium) */}
      <Points ref={midRef} positions={mid.positions} stride={3}>
        <PointMaterial
          transparent
          color="#99ffcc"
          size={0.12}   // bigger medium stars
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>


      {/* NEAR stars (large and bright) */}
      <Points ref={nearRef} positions={near.positions} stride={3}>
        <PointMaterial
          transparent
          color="#ccffee"
          size={0.22}   // large stars
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>

    </>

  )

}

/* ================= SPHERE PARTICLES ================= */

function EnergySphere({ zoom }) {

  const ref = useRef()

  const count = 5000

  const { sphere, colors } = useMemo(() => {

    const sphere = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    const green = new THREE.Color("#00ff88")

    for (let i = 0; i < count; i++) {

      const i3 = i * 3

      const phi = Math.acos(-1 + (2 * i) / count)
      const theta = Math.sqrt(count * Math.PI) * phi

      const r = 3.5

      sphere[i3] = r * Math.cos(theta) * Math.sin(phi)
      sphere[i3 + 1] = r * Math.sin(theta) * Math.sin(phi)
      sphere[i3 + 2] = r * Math.cos(phi)

      colors[i3] = green.r
      colors[i3 + 1] = green.g
      colors[i3 + 2] = green.b

    }

    return { sphere, colors }

  }, [])



  useFrame((state) => {

    const time = state.clock.getElapsedTime()

    ref.current.rotation.y = time * 0.15

    if (zoom) {

      /* clear zoom out animation */
      ref.current.scale.x += (20 - ref.current.scale.x) * 0.06
      ref.current.scale.y += (20 - ref.current.scale.y) * 0.06
      ref.current.scale.z += (20 - ref.current.scale.z) * 0.06

    }

  })



  return (

    <Points
      ref={ref}
      positions={sphere}
      colors={colors}
      stride={3}
    >

      <PointMaterial
        transparent
        vertexColors
        size={0.07}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />

    </Points>

  )

}



/* ================= HEADER ================= */

function Header() {

  return (

    <div style={{
      position: "fixed",
      top: "60px",
      width: "100%",
      textAlign: "center",
      fontFamily: "Times New Roman",
      fontSize: "42px",
      color: "#00ff88",
      letterSpacing: "6px",
      zIndex: 10
    }}>

      SORT THE BALLS

      <div style={{ marginTop: "10px" }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <span key={i} style={{
            display: "inline-block",
            width: "5px",
            height: "5px",
            margin: "4px",
            borderRadius: "50%",
            background: "#00ff88"
          }} />
        ))}
      </div>

    </div>

  )

}



/* ================= START BUTTON ================= */

function StartButton({ onStart }) {

  return (

    <div style={{
      position: "fixed",
      bottom: "120px",
      width: "100%",
      textAlign: "center",
      zIndex: 10
    }}>

      <button
        onClick={onStart}
        style={{
          fontFamily: "Times New Roman",
          fontSize: "24px",
          padding: "12px 50px",
          color: "#00ff88",
          background: "transparent",
          border: "2px solid rgba(0,255,136,0.5)",
          borderRadius: "8px",
          cursor: "pointer",
          backdropFilter: "blur(6px)"
        }}
      >
        START
      </button>

    </div>

  )

}



/* ================= MAIN ================= */

export default function SortTheBallsBackground() {

  const [zoom, setZoom] = useState(false)

  const navigate = useNavigate()



  function handleStart() {

    setZoom(true)

    /* navigate after zoom animation */
    setTimeout(() => {

      navigate("/game")

    }, 1200)

  }



  return (

    <div style={{
      position: "fixed",
      inset: 0,
      background: "#000"
    }}>

      <Canvas
        style={{
          position: "absolute",
          inset: 0
        }}
        camera={{ position: [0, 0, 20], fov: 60 }}
      >

        <DeepSpaceStars />


        <EnergySphere zoom={zoom} />

      </Canvas>

      <Header />

      <StartButton onStart={handleStart} />

    </div>

  )

}
