import React, { useRef, useMemo, useEffect, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Points, PointMaterial } from "@react-three/drei"
import * as THREE from "three"



/* ================= MAIN PARTICLE SYSTEM ================= */

function CountdownParticles() {

  const ref = useRef()

  const count = 9000

  const [displayText, setDisplayText] = useState("30")

  const [audioReady, setAudioReady] = useState(false)



  /* ================= LOAD SOUNDS ================= */

  const tickSound = useMemo(() => {

    const audio = new Audio("/sounds/tick.mp3")
    audio.volume = 0.5
    return audio

  }, [])

  const endSound = useMemo(() => {

    const audio = new Audio("/sounds/end.mp3")
    audio.volume = 0.7
    return audio

  }, [])



  /* ================= AUDIO UNLOCK ================= */

  useEffect(() => {

    const unlockAudio = () => {

      tickSound.volume = 0

      tickSound.play()
        .then(() => {

          tickSound.pause()
          tickSound.currentTime = 0
          tickSound.volume = 0.5

          setAudioReady(true)

          console.log("Audio unlocked")

        })
        .catch(() => {})

      window.removeEventListener("click", unlockAudio)

    }

    window.addEventListener("click", unlockAudio)

    return () => {
      window.removeEventListener("click", unlockAudio)
    }

  }, [tickSound])



  /* ================= RANDOM START POSITIONS ================= */

  const randomPositions = useMemo(() => {

    const arr = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {

      const i3 = i * 3

      arr[i3] = (Math.random() - 0.5) * 100
      arr[i3 + 1] = (Math.random() - 0.5) * 100
      arr[i3 + 2] = (Math.random() - 0.5) * 100

    }

    return arr

  }, [])



  /* ================= TEXT TO PARTICLES ================= */

  function createTextShape(text) {

    const canvas = document.createElement("canvas")

    canvas.width = 800
    canvas.height = 400

    const ctx = canvas.getContext("2d")

    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.font = "bold 200px Arial"
    ctx.fillStyle = "white"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    ctx.fillText(text, canvas.width / 2, canvas.height / 2)

    const imageData =
      ctx.getImageData(0, 0, canvas.width, canvas.height).data

    const positions = new Float32Array(count * 3)

    let index = 0

    for (let y = 0; y < canvas.height; y += 3) {

      for (let x = 0; x < canvas.width; x += 3) {

        const i = (y * canvas.width + x) * 4

        if (imageData[i] > 200 && index < count) {

          const i3 = index * 3

          positions[i3] =
            (x - canvas.width / 2) / 20

          positions[i3 + 1] =
            -(y - canvas.height / 2) / 20

          positions[i3 + 2] = 0

          index++

        }

      }

    }

    return positions

  }



  const [targetPositions, setTargetPositions] =
    useState(randomPositions)



  /* ================= COUNTDOWN ================= */

  useEffect(() => {

    if (!audioReady) return

    let current = 30

    setDisplayText("30")

    const interval = setInterval(() => {

      current--

      if (current >= 0) {

        setDisplayText(current.toString())

        tickSound.currentTime = 0
        tickSound.play().catch(()=>{})

      }

      if (current === 0) {

        setTimeout(() => {

          setDisplayText("TIME UP")

          endSound.currentTime = 0
          endSound.play().catch(()=>{})

        }, 800)

      }

      if (current < 0) {

        clearInterval(interval)

      }

    }, 1000)

    return () => clearInterval(interval)

  }, [audioReady, tickSound, endSound])



  /* ================= UPDATE TARGET SHAPE ================= */

  useEffect(() => {

    const shape =
      createTextShape(displayText)

    setTargetPositions(shape)

  }, [displayText])



  /* ================= MORPH ANIMATION ================= */

  useFrame(() => {

    const positions =
      ref.current.geometry.attributes.position.array

    for (let i = 0; i < count * 3; i++) {

      positions[i] =
        THREE.MathUtils.lerp(
          positions[i],
          targetPositions[i],
          0.08
        )

    }

    ref.current.geometry.attributes.position.needsUpdate = true

  })



  return (

    <Points
      ref={ref}
      positions={randomPositions}
      stride={3}
    >

      <PointMaterial
        transparent
        color="#00f2ff"
        size={0.12}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />

    </Points>

  )

}



/* ================= MAIN BACKGROUND ================= */

export default function CountdownTimeUpBackground() {

  return (

    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        zIndex: -1
      }}
    >

      <Canvas camera={{ position: [0, 0, 25], fov: 60 }}>

        <color attach="background" args={["#000"]} />

        <CountdownParticles />

      </Canvas>

    </div>

  )

}
