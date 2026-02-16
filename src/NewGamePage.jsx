import React, { useRef, useMemo, useEffect, useState, useCallback } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Points, PointMaterial } from "@react-three/drei"
import * as THREE from "three"
import { useNavigate } from "react-router-dom"


/* ================= MAIN PARTICLE SYSTEM ================= */
function CountdownParticles({ onTimeUp, isRunning }) {
  const ref = useRef()
  const count = 9000
  const [displayText, setDisplayText] = useState("30")
  const [audioReady, setAudioReady] = useState(false)
  const intervalRef = useRef(null)

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

  useEffect(() => {
    const unlockAudio = () => {
      tickSound.volume = 0
      tickSound.play()
        .then(() => {
          tickSound.pause()
          tickSound.currentTime = 0
          tickSound.volume = 0.5
          setAudioReady(true)
        })
        .catch(() => {})
      window.removeEventListener("click", unlockAudio)
    }
    window.addEventListener("click", unlockAudio)
    return () => window.removeEventListener("click", unlockAudio)
  }, [tickSound])

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
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    const positions = new Float32Array(count * 3)
    let index = 0
    for (let y = 0; y < canvas.height; y += 3) {
      for (let x = 0; x < canvas.width; x += 3) {
        const i = (y * canvas.width + x) * 4
        if (imageData[i] > 200 && index < count) {
          const i3 = index * 3
          positions[i3] = (x - canvas.width / 2) / 20
          positions[i3 + 1] = -(y - canvas.height / 2) / 20
          positions[i3 + 2] = 0
          index++
        }
      }
    }
    return positions
  }

  const [targetPositions, setTargetPositions] = useState(randomPositions)

  useEffect(() => {
    if (!isRunning || !audioReady) return
    let current = 30
    setDisplayText("30")
    intervalRef.current = setInterval(() => {
      current--
      if (current >= 0) {
        setDisplayText(current.toString())
        tickSound.currentTime = 0
        tickSound.play().catch(() => {})
      }
      if (current === 0) {
        setDisplayText("TIME UP")
        endSound.currentTime = 0
        endSound.play().catch(() => {})
        setTimeout(() => onTimeUp(), 2000)
      }
      if (current < 0) clearInterval(intervalRef.current)
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [isRunning, audioReady, tickSound, endSound, onTimeUp])

  useEffect(() => {
    if (!isRunning) setDisplayText("30")
  }, [isRunning])

  useEffect(() => {
    const shape = createTextShape(displayText)
    setTargetPositions(shape)
  }, [displayText])

  useFrame(() => {
    if (!ref.current) return
    const positions = ref.current.geometry.attributes.position.array
    for (let i = 0; i < count * 3; i++) {
      positions[i] = THREE.MathUtils.lerp(positions[i], targetPositions[i], 0.08)
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <Points ref={ref} positions={randomPositions} stride={3}>
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


/* ================= PATTERN GENERATOR (unchanged) ================= */
function generateComplexPattern() {
  const colors = [
    { name: "red",    hex: "#EF4444", bg: "bg-red-500"    },
    { name: "blue",   hex: "#3B82F6", bg: "bg-blue-500"   },
    { name: "green",  hex: "#10B981", bg: "bg-green-500"  },
    { name: "purple", hex: "#A855F7", bg: "bg-purple-500" },
    { name: "yellow", hex: "#FBBF24", bg: "bg-yellow-400" }
  ]
  const colorArray = []
  colors.forEach(c => { for (let i = 0; i < 5; i++) colorArray.push(c) })
  for (let pass = 0; pass < 3; pass++) {
    for (let i = colorArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [colorArray[i], colorArray[j]] = [colorArray[j], colorArray[i]]
    }
  }
  return colorArray
}


/* ================= SHARED: ANIMATED COLOR MATRIX ================= */
function ColorMatrix({ pattern, isShuffling, compact = false }) {
  const ballSize = compact ? "w-10 h-10" : "w-14 h-14"
  const pad      = compact ? "p-4" : "p-5"
  return (
    <div className={`bg-gray-900 bg-opacity-80 ${pad} rounded-lg shadow-2xl border-2 border-cyan-500 backdrop-blur`}>
      <div className="grid grid-cols-5 gap-2">
        {pattern.map((color, i) => (
          <div
            key={i}
            className={`
              ${ballSize} rounded-full ${color.bg} shadow-lg border-2 border-gray-800
              transition-all duration-500 ease-in-out
              ${isShuffling ? "scale-75 rotate-180 opacity-50" : "scale-100 rotate-0 opacity-100"}
            `}
            style={{ transitionDelay: isShuffling ? `${(i % 5) * 40}ms` : `${i * 18}ms` }}
          />
        ))}
      </div>
    </div>
  )
}


/* ================================================================
   PHASE 1 — SETUP
================================================================ */
function SetupPhase({ pattern, onRefresh, onStartGame }) {
  const [isShuffling, setIsShuffling] = useState(false)

  const handleRefresh = () => {
    if (isShuffling) return
    setIsShuffling(true)
    setTimeout(() => {
      onRefresh()
      setTimeout(() => setIsShuffling(false), 500)
    }, 400)
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-8 px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-cyan-400 tracking-widest mb-1">MEMORY MATRIX</h1>
        <p className="text-gray-400 text-sm">Study the pattern carefully, then recreate it from memory</p>
      </div>
      <div className="flex flex-col items-center gap-3">
        <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Current Pattern</p>
        <ColorMatrix pattern={pattern} isShuffling={isShuffling} />
      </div>
      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        <button
          onClick={handleRefresh}
          disabled={isShuffling}
          className={`
            w-full py-3 rounded-lg border-2 border-cyan-700 text-cyan-300 font-semibold tracking-wider
            transition-all duration-200 hover:bg-cyan-900 hover:border-cyan-400 hover:text-cyan-100
            ${isShuffling ? "opacity-40 cursor-not-allowed" : "hover:scale-105 cursor-pointer"}
          `}
        >
          {isShuffling ? "⟳  Shuffling…" : "⟳  Refresh Pattern"}
        </button>
        <button
          onClick={onStartGame}
          className="
            w-full py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold tracking-wider
            transition-all duration-200 hover:scale-105 shadow-lg shadow-cyan-900
          "
        >
          START GAME →
        </button>
      </div>
    </div>
  )
}


/* ================================================================
   PHASE 2 — READY / PLAYING
   ★ CHANGED: unified background + slow slide animation
================================================================ */

// Shared colour — matrix panel + Three.js canvas bg, so there's zero seam
const PANEL_BG = "#070d18"

function ReadyPhase({ pattern, gamePhase, onStartTimer, onTimeUp }) {
  const isPlaying = gamePhase === "playing"
  const isVisible = gamePhase === "ready" || gamePhase === "playing" || gamePhase === "timeup"

  return (
    <div className="flex w-full h-full" style={{ background: PANEL_BG }}>

      {/* LEFT: matrix — slides slowly from left (1.1 s ease-out) */}
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          padding: "1.5rem",
          gap: "1.5rem",
          borderRight: "1px solid rgba(0,242,255,0.07)",
          width: isVisible ? "50%" : "0%",
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateX(0)" : "translateX(-60px)",
          transition: [
            "width 1.1s cubic-bezier(0.25,0.8,0.25,1)",
            "opacity 0.9s ease-out",
            "transform 1.1s cubic-bezier(0.25,0.8,0.25,1)",
          ].join(", "),
        }}
      >
        <div className="text-center whitespace-nowrap">
          <h2 className="text-xl font-bold text-cyan-400 tracking-widest mb-1">STUDY THE PATTERN</h2>
          <p className="text-gray-500 text-xs">Remember every position</p>
        </div>
        <ColorMatrix pattern={pattern} isShuffling={false} compact />
      </div>

      {/* RIGHT: particle canvas — slides from right with tiny delay */}
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
          width: isVisible ? "50%" : "0%",
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateX(0)" : "translateX(60px)",
          transition: [
            "width 1.1s cubic-bezier(0.25,0.8,0.25,1) 0.05s",
            "opacity 0.9s ease-out 0.05s",
            "transform 1.1s cubic-bezier(0.25,0.8,0.25,1) 0.05s",
          ].join(", "),
        }}
      >
        {/* Three.js canvas — exact same colour, no visible seam */}
        <div className="absolute inset-0">
          <Canvas camera={{ position: [0, 0, 20], fov: 60 }}>
            <color attach="background" args={[PANEL_BG]} />
            <CountdownParticles onTimeUp={onTimeUp} isRunning={isPlaying} />
          </Canvas>
        </div>

        {/* START TIMER button */}
        <div className={`
          relative z-10 flex flex-col items-center gap-4
          transition-all duration-500
          ${gamePhase === "ready" ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"}
        `}>
          <p className="text-cyan-300 text-sm tracking-widest font-semibold animate-pulse">TIMER READY</p>
          <button
            onClick={onStartTimer}
            className="
              px-10 py-4 bg-green-500 hover:bg-green-400 text-black font-bold text-lg rounded-lg
              transition-all duration-200 hover:scale-110 shadow-xl shadow-green-900
            "
          >
            ▶ Start Timer
          </button>
        </div>

        {/* Running badge */}
        <div className={`
          relative z-10 mt-auto mb-8 transition-opacity duration-500
          ${isPlaying ? "opacity-100" : "opacity-0"}
        `}>
          <span className="text-xs text-red-400 tracking-widest animate-pulse font-semibold">
            ● TIMER RUNNING
          </span>
        </div>
      </div>
    </div>
  )
}


/* ================================================================
   PHASE 3 — TIME UP OVERLAY
   ★ CHANGED: dark purple / deep violet — dramatic but not harsh
================================================================ */
function TimeUpOverlay({ isVisible }) {
  return (
    <div
      className={`
        fixed inset-0 z-50 flex flex-col items-center justify-center
        transition-all duration-700 ease-in-out
        ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"}
      `}
      style={{
        background: "radial-gradient(ellipse at 50% 45%, #1e0040 0%, #0d001f 55%, #000 100%)",
        backdropFilter: isVisible ? "blur(8px)" : "none",
      }}
    >
      {/* Soft ambient glow */}
      <div style={{
        position: "absolute", width: 560, height: 560, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(160,0,255,0.22) 0%, transparent 70%)",
        filter: "blur(50px)", pointerEvents: "none",
      }} />

      {/* Ping rings — purple/magenta */}
      <div style={{
        position: "absolute", width: 440, height: 440, borderRadius: "50%",
        border: "2px solid rgba(180,60,255,0.28)", pointerEvents: "none",
        animation: isVisible ? "ping 2s cubic-bezier(0,0,0.2,1) infinite" : "none",
      }} />
      <div style={{
        position: "absolute", width: 310, height: 310, borderRadius: "50%",
        border: "1.5px solid rgba(140,40,255,0.2)", pointerEvents: "none",
        animation: isVisible ? "ping 2s cubic-bezier(0,0,0.2,1) infinite" : "none",
        animationDelay: "0.55s",
      }} />

      {/* Main text */}
      <div className={`
        text-center z-10 transition-all duration-1000 delay-150
        ${isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"}
      `}>
        {["TIME", "UP!"].map((word, wi) => (
          <h1
            key={wi}
            className="font-black tracking-widest leading-none select-none"
            style={{
              fontSize: "clamp(5rem, 13vw, 9.5rem)",
              color: "#fff",
              textShadow: [
                "0 0 30px rgba(180,0,255,0.95)",
                "0 0 70px rgba(140,0,255,0.65)",
                "0 0 140px rgba(100,0,210,0.4)",
                "3px 0 0 rgba(255,0,200,0.35)",
                "-3px 0 0 rgba(0,200,255,0.3)",
              ].join(", "),
            }}
          >
            {word}
          </h1>
        ))}
        <p
          className="text-lg tracking-widest font-semibold mt-6 animate-pulse"
          style={{ color: "rgba(210,160,255,0.85)" }}
        >
          Returning to setup…
        </p>
      </div>

      {/* Progress bar — purple → cyan */}
      <div className="z-10 rounded-full overflow-hidden"
        style={{ marginTop: "3rem", width: 260, height: 3, background: "rgba(255,255,255,0.08)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #a855f7, #06b6d4)",
            width: isVisible ? "100%" : "0%",
            transition: isVisible ? "width 4800ms linear" : "width 0ms",
          }}
        />
      </div>
    </div>
  )
}


/* ================================================================
   MAIN GAME PAGE
================================================================ */
export default function NewGamePage() {
  const navigate = useNavigate()

  const [gamePhase, setGamePhase] = useState("setup")
  const [pattern,   setPattern]   = useState(() => generateComplexPattern())

  const handleRefreshPattern = useCallback(() => setPattern(generateComplexPattern()), [])
  const handleStartGame      = useCallback(() => setGamePhase("ready"), [])
  const handleStartTimer     = useCallback(() => setGamePhase("playing"), [])

  const handleTimeUp = useCallback(() => {
    setGamePhase("timeup")
    setTimeout(() => setGamePhase("setup"), 5000)
  }, [])

  const showSplit = gamePhase === "ready" || gamePhase === "playing" || gamePhase === "timeup"

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">

      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{ background: "radial-gradient(ellipse at center, rgba(0,242,255,0.04) 0%, transparent 70%)" }}
      />

      {/* PHASE 1 – SETUP */}
      <div className={`
        absolute inset-0 z-10 transition-all duration-700 ease-in-out
        ${gamePhase === "setup" ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6 pointer-events-none"}
      `}>
        <SetupPhase pattern={pattern} onRefresh={handleRefreshPattern} onStartGame={handleStartGame} />
      </div>

      {/* PHASE 2 – READY / PLAYING */}
      <div className={`
        absolute inset-0 z-10 transition-all duration-700 ease-in-out
        ${showSplit ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"}
      `}>
        {showSplit && (
          <ReadyPhase
            pattern={pattern}
            gamePhase={gamePhase}
            onStartTimer={handleStartTimer}
            onTimeUp={handleTimeUp}
          />
        )}
      </div>

      {/* PHASE 3 – TIME UP OVERLAY */}
      <TimeUpOverlay isVisible={gamePhase === "timeup"} />
    </div>
  )
}