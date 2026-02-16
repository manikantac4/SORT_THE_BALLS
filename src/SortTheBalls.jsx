import React, { useRef, useMemo, useEffect, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Points, PointMaterial } from "@react-three/drei"
import * as THREE from "three"
import { useNavigate } from "react-router-dom"


/* ================= MAIN PARTICLE SYSTEM ================= */
function CountdownParticles({ onTimeUp }) {
  const ref = useRef()
  const count = 9000
  const [displayText, setDisplayText] = useState("30")
  const [audioReady, setAudioReady] = useState(false)

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
    if (!audioReady) return

    let current = 30
    setDisplayText("30")

    const interval = setInterval(() => {
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

  // call after showing TIME UP
  setTimeout(() => {
    onTimeUp()
  }, 10000) // 10 sec delay

}


      if (current < 0) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [audioReady, tickSound, endSound, onTimeUp])

  useEffect(() => {
    const shape = createTextShape(displayText)
    setTargetPositions(shape)
  }, [displayText])

  useFrame(() => {
    if (!ref.current) return
    const positions = ref.current.geometry.attributes.position.array

    for (let i = 0; i < count * 3; i++) {
      positions[i] = THREE.MathUtils.lerp(
        positions[i],
        targetPositions[i],
        0.08
      )
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

/* ================= COMPLEX PATTERN GENERATOR ================= */
function generateComplexPattern() {
  const colors = [
    { name: "red", hex: "#EF4444", bg: "bg-red-500" },
    { name: "blue", hex: "#3B82F6", bg: "bg-blue-500" },
    { name: "green", hex: "#10B981", bg: "bg-green-500" },
    { name: "purple", hex: "#A855F7", bg: "bg-purple-500" },
    { name: "yellow", hex: "#FBBF24", bg: "bg-yellow-400" }
  ]

  // Create array with 5 of each color
  const colorArray = []
  colors.forEach(color => {
    for (let i = 0; i < 5; i++) {
      colorArray.push(color)
    }
  })

  // Advanced shuffle: multiple passes for maximum complexity
  for (let pass = 0; pass < 3; pass++) {
    for (let i = colorArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [colorArray[i], colorArray[j]] = [colorArray[j], colorArray[i]]
    }
  }

  return colorArray
}

/* ================= COLOR MATRIX DISPLAY ================= */
function ColorMatrixDisplay({ isVisible }) {
  const [matrixPattern] = useState(generateComplexPattern())

  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ${
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
      }`}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-cyan-400 mb-2">STUDY THE PATTERN</h2>
        <p className="text-gray-400 text-sm">You have 30 seconds to arrange</p>
      </div>

      <div className="bg-gray-900 bg-opacity-80 p-5 rounded-lg shadow-2xl border-2 border-cyan-500 backdrop-blur">
        <div className="grid grid-cols-5 gap-2">
          {matrixPattern.map((color, index) => (
            <div
              key={index}
              className={`w-14 h-14 rounded-full ${color.bg} shadow-lg border-2 border-gray-800 hover:shadow-xl transition-all duration-200 transform hover:scale-110 cursor-pointer`}
              title={`Position ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ================= ARRANGEMENT INTERFACE ================= */
function ArrangementInterface({ isVisible, originalPattern, onComplete }) {
  const [userArrangement, setUserArrangement] = useState(Array(25).fill(null))
  const [availableColors, setAvailableColors] = useState(() => {
    const colors = [
      { name: "red", hex: "#EF4444", bg: "bg-red-500" },
      { name: "blue", hex: "#3B82F6", bg: "bg-blue-500" },
      { name: "green", hex: "#10B981", bg: "bg-green-500" },
      { name: "purple", hex: "#A855F7", bg: "bg-purple-500" },
      { name: "yellow", hex: "#FBBF24", bg: "bg-yellow-400" }
    ]
    // Count remaining colors
    return colors.map(color => ({
      ...color,
      count: 5
    }))
  })
  const [feedback, setFeedback] = useState("")
  const [correctCount, setCorrectCount] = useState(0)

  const handleColorClick = (colorIndex) => {
    if (availableColors[colorIndex].count <= 0) return

    // Find first empty spot
    const emptyIndex = userArrangement.findIndex(item => item === null)
    if (emptyIndex === -1) return

    // Place color
    const newArrangement = [...userArrangement]
    newArrangement[emptyIndex] = colorIndex
    setUserArrangement(newArrangement)

    // Update available count
    const newAvailable = [...availableColors]
    newAvailable[colorIndex].count -= 1
    setAvailableColors(newAvailable)

    // Check if correct
    if (originalPattern[emptyIndex].name === availableColors[colorIndex].name) {
      setCorrectCount(prev => prev + 1)
      setFeedback("✓ Correct!")
      setTimeout(() => setFeedback(""), 1000)
    } else {
      setFeedback("✗ Wrong position")
      setTimeout(() => setFeedback(""), 1500)
    }
  }

  const handleUndo = () => {
    const lastFilledIndex = userArrangement.length - 1
    for (let i = lastFilledIndex; i >= 0; i--) {
      if (userArrangement[i] !== null) {
        const newArrangement = [...userArrangement]
        const colorIndex = newArrangement[i]
        newArrangement[i] = null
        setUserArrangement(newArrangement)

        const newAvailable = [...availableColors]
        newAvailable[colorIndex].count += 1
        setAvailableColors(newAvailable)
        break
      }
    }
  }

  const handleReset = () => {
    setUserArrangement(Array(25).fill(null))
    setAvailableColors(availableColors.map(c => ({ ...c, count: 5 })))
    setCorrectCount(0)
    setFeedback("")
  }

  const handleSubmit = () => {
    if (userArrangement.some(item => item === null)) {
      setFeedback("Complete all 25 positions first!")
      return
    }

    let correct = 0
    userArrangement.forEach((colorIndex, pos) => {
      if (colorIndex !== null && originalPattern[pos].name === availableColors[colorIndex].name) {
        correct++
      }
    })

    onComplete(correct)
  }

  const colors = [
    { name: "red", hex: "#EF4444", bg: "bg-red-500" },
    { name: "blue", hex: "#3B82F6", bg: "bg-blue-500" },
    { name: "green", hex: "#10B981", bg: "bg-green-500" },
    { name: "purple", hex: "#A855F7", bg: "bg-purple-500" },
    { name: "yellow", hex: "#FBBF24", bg: "bg-yellow-400" }
  ]

  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 overflow-y-auto ${
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
      }`}
    >
      <div className="py-8">
        <h2 className="text-4xl font-bold text-cyan-400 mb-2">RECREATE THE PATTERN</h2>
        <p className="text-gray-400 text-sm text-center">
          Correct: <span className="text-green-400 font-bold">{correctCount}</span> / 25
        </p>
      </div>

      <div className="bg-gray-900 bg-opacity-80 p-8 rounded-lg shadow-2xl border-2 border-cyan-500 backdrop-blur mb-8">
        <div className="grid grid-cols-5 gap-3 mb-4">
          {userArrangement.map((colorIndex, index) => (
            <div
              key={index}
              className={`w-16 h-16 rounded-full border-2 border-gray-600 shadow-lg flex items-center justify-center cursor-pointer hover:border-cyan-400 transition-all ${
                colorIndex !== null
                  ? colors[colorIndex].bg
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
              onClick={() => {
                if (colorIndex !== null) {
                  const newArr = [...userArrangement]
                  newArr[index] = null
                  setUserArrangement(newArr)
                  const newAvail = [...availableColors]
                  newAvail[colorIndex].count += 1
                  setAvailableColors(newAvail)
                }
              }}
              title={colorIndex !== null ? `Tap to remove` : `Position ${index + 1}`}
            >
              {colorIndex !== null && (
                <span className="text-white text-xs font-bold">✓</span>
              )}
            </div>
          ))}
        </div>

        {feedback && (
          <div className={`text-center mb-4 text-lg font-bold ${
            feedback.includes("✓") ? "text-green-400" : "text-red-400"
          }`}>
            {feedback}
          </div>
        )}
      </div>

      <div className="bg-gray-900 bg-opacity-80 p-6 rounded-lg border-2 border-gray-700 backdrop-blur mb-8">
        <p className="text-gray-300 text-sm mb-4 text-center font-semibold">Select Colors to Place</p>
        <div className="grid grid-cols-5 gap-4">
          {colors.map((color, idx) => (
            <button
              key={idx}
              onClick={() => handleColorClick(idx)}
              disabled={availableColors[idx].count === 0}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                availableColors[idx].count > 0
                  ? `${color.bg} border-yellow-300 hover:scale-110 cursor-pointer hover:shadow-lg`
                  : "bg-gray-700 border-gray-600 opacity-50 cursor-not-allowed"
              }`}
            >
              <span className="text-white font-bold text-2xl">{availableColors[idx].count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleUndo}
          className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition-all hover:scale-105"
        >
          ← Undo
        </button>
        <button
          onClick={handleReset}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all hover:scale-105"
        >
          Reset
        </button>
        <button
          onClick={handleSubmit}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all hover:scale-105"
        >
          Submit
        </button>
      </div>
    </div>
  )
}

/* ================= RESULT SCREEN ================= */
function ResultScreen({ isVisible, score, onRestart }) {
  const percentage = Math.round((score / 25) * 100)
  const getGrade = () => {
    if (score === 25) return { text: "PERFECT!", color: "text-yellow-400" }
    if (score >= 20) return { text: "EXCELLENT!", color: "text-green-400" }
    if (score >= 15) return { text: "GOOD!", color: "text-blue-400" }
    if (score >= 10) return { text: "DECENT!", color: "text-purple-400" }
    return { text: "TRY AGAIN!", color: "text-red-400" }
  }

  const grade = getGrade()

  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ${
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
      }`}
    >
      <div className="bg-gray-900 bg-opacity-95 backdrop-blur p-12 rounded-xl border-2 border-cyan-500 shadow-2xl text-center">
        <h1 className={`text-6xl font-bold mb-6 ${grade.color}`}>
          {grade.text}
        </h1>
        <p className="text-5xl font-bold text-white mb-2">
          {score} <span className="text-2xl text-gray-400">/25</span>
        </p>
        <p className="text-3xl font-bold text-cyan-400 mb-8">{percentage}%</p>

        <div className="w-64 h-4 bg-gray-700 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <button
          onClick={onRestart}
          className="px-8 py-4 bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-lg rounded-lg transition-all hover:scale-105 mb-4"
        >
          TRY AGAIN
        </button>

        <p className="text-gray-400 text-sm mt-4">
          {score === 25
            ? "You have a perfect memory! 🎉"
            : score >= 20
            ? "Incredible memory skills!"
            : score >= 15
            ? "Nice job! Practice more!"
            : "Keep practicing!"}
        </p>
      </div>
    </div>
  )
}

/* ================= MAIN GAME PAGE ================= */
export default function GamePage() {

  const navigate = useNavigate()

  const [gameState, setGameState] = useState("display")
  const [originalPattern, setOriginalPattern] = useState(() => generateComplexPattern())
  const [finalScore, setFinalScore] = useState(0)

  const handleTimeUp = () => {

    setGameState("arrangement")

    // redirect after 10 seconds
    setTimeout(() => {
      navigate("/")
    }, 10000)

  }


  const handleComplete = (score) => {
    setFinalScore(score)
    setGameState("result")
  }

  const handleRestart = () => {
    setOriginalPattern(generateComplexPattern())
    setGameState("display")
  }

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
      {/* Background Canvas */}
      <div
  style={{
    position: "fixed",
    top: 0,
    right: 0,
    width: "50%",     // only right half
    height: "100%",
    background: "#000",
    zIndex: 0
  }}
>

      
        <Canvas camera={{ position: [0, 0, 20], fov: 60 }}>
          <color attach="background" args={["#000"]} />
          <CountdownParticles onTimeUp={handleTimeUp} />
        </Canvas>
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full h-full flex">
        {/* Left Side */}
        <div className="w-1/2 h-full bg-gradient-to-r from-black via-gray-900 to-transparent flex items-center justify-center p-8 relative">
          <ColorMatrixDisplay isVisible={gameState === "display"} />
        </div>

       
      </div>
    </div>
  )
}