import React, { useRef, useMemo, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Points, PointMaterial } from "@react-three/drei"
import * as THREE from "three"

/* ================= SPARKLE BACKGROUND ================= */
function DeepSpaceStars() {
  const nearRef = useRef()
  const midRef = useRef()
  const farRef = useRef()

  const nearCount = 1400
  const midCount = 2400
  const farCount = 2200

  function createLayer(count, spread, speedMax) {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      positions[i3] = (Math.random() - 0.5) * spread
      positions[i3 + 1] = (Math.random() - 0.5) * spread
      positions[i3 + 2] = (Math.random() - 0.5) * spread
      speeds[i] = Math.random() < 0.4 ? 0 : Math.random() * speedMax
    }

    return { positions, speeds }
  }

  const near = useMemo(() => createLayer(nearCount, 200, 0.015), [])
  const mid = useMemo(() => createLayer(midCount, 300, 0.008), [])
  const far = useMemo(() => createLayer(farCount, 400, 0.003), [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()

    function animate(ref, layer, sparkleSpeed) {
      const positions = ref.current.geometry.attributes.position.array

      for (let i = 0; i < layer.speeds.length; i++) {
        const speed = layer.speeds[i]
        if (speed !== 0) {
          const i3 = i * 3
          positions[i3 + 1] += speed
          if (positions[i3 + 1] > 200) positions[i3 + 1] = -200
        }
      }

      ref.current.geometry.attributes.position.needsUpdate = true
      ref.current.material.opacity = 0.65 + Math.sin(t * sparkleSpeed) * 0.35
    }

    animate(farRef, far, 0.5)
    animate(midRef, mid, 1.0)
    animate(nearRef, near, 1.8)
  })

  return (
    <>
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

      <Points ref={midRef} positions={mid.positions} stride={3}>
        <PointMaterial
          transparent
          color="#99ffcc"
          size={0.12}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>

      <Points ref={nearRef} positions={near.positions} stride={3}>
        <PointMaterial
          transparent
          color="#ccffee"
          size={0.22}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </>
  )
}

/* ================= UTILITY FUNCTIONS ================= */

// Shuffle array
const shuffleArray = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Create color palette (5 colors × 5 times = 25)
const createColorPalette = () => {
  const colors = [
    new THREE.Color(0xff0000), // Red
    new THREE.Color(0x0000ff), // Blue
    new THREE.Color(0x00ff00), // Green
    new THREE.Color(0x800080), // Purple
    new THREE.Color(0xffff00), // Yellow
  ]
  
  const palette = []
  for (let i = 0; i < 5; i++) {
    colors.forEach(color => palette.push(color))
  }
  
  return shuffleArray(palette)
}

/* ================= ENERGY SPHERE WITH ANIMATION ================= */

function EnergySphere({ animationState, onAnimationComplete }) {
  const pointsRef = useRef()
  const count = 5000
  
  const explosionProgress = useRef(0)
  const formationProgress = useRef(0)
  const floatTime = useRef(0)

  // Initial sphere positions and particle data
  const particleData = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const velocities = []
    const speeds = []
    const delays = []
    
    const green = new THREE.Color("#00ff88")

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      
      // Fibonacci sphere distribution
      const phi = Math.acos(-1 + (2 * i) / count)
      const theta = Math.sqrt(count * Math.PI) * phi
      const r = 3.5

      positions[i3] = r * Math.cos(theta) * Math.sin(phi)
      positions[i3 + 1] = r * Math.sin(theta) * Math.sin(phi)
      positions[i3 + 2] = r * Math.cos(phi)

      colors[i3] = green.r
      colors[i3 + 1] = green.g
      colors[i3 + 2] = green.b

      // Explosion direction (normalized vector from origin)
      const direction = new THREE.Vector3(
        positions[i3],
        positions[i3 + 1],
        positions[i3 + 2]
      ).normalize()
      
      velocities.push(direction)
      speeds.push(0.8 + Math.random() * 1.4) // Random speed 0.8-2.2
      delays.push(Math.random() * 0.15) // Staggered timing
    }

    return { positions, colors, velocities, speeds, delays }
  }, [])

  // Matrix target positions
  const matrixTargets = useMemo(() => {
    const targets = new Float32Array(count * 3)
    const targetColors = new Float32Array(count * 3)
    const gridSize = 5
    const spacing = 1.2
    const particlesPerCluster = count / 25 // 200 particles per cluster
    const colorPalette = createColorPalette()
    
    let particleIndex = 0
    
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const clusterIndex = row * gridSize + col
        const centerX = (col - gridSize / 2 + 0.5) * spacing
        const centerY = (row - gridSize / 2 + 0.5) * spacing
        const color = colorPalette[clusterIndex]
        
        // Distribute particles in circular cluster
        for (let p = 0; p < particlesPerCluster; p++) {
          const angle = (p / particlesPerCluster) * Math.PI * 2
          const radius = Math.sqrt(Math.random()) * 0.18 // Circular distribution
          const offsetX = Math.cos(angle) * radius
          const offsetY = Math.sin(angle) * radius
          const offsetZ = (Math.random() - 0.5) * 0.08
          
          targets[particleIndex * 3] = centerX + offsetX
          targets[particleIndex * 3 + 1] = centerY + offsetY
          targets[particleIndex * 3 + 2] = offsetZ
          
          targetColors[particleIndex * 3] = color.r
          targetColors[particleIndex * 3 + 1] = color.g
          targetColors[particleIndex * 3 + 2] = color.b
          
          particleIndex++
        }
      }
    }
    
    return { targets, targetColors }
  }, [])

  // Store current state for interpolation
  const currentPositions = useRef(new Float32Array(particleData.positions))
  const currentSizes = useRef(new Float32Array(count).fill(0.07))

  useFrame((state, delta) => {
    if (!pointsRef.current) return
    
    const positions = pointsRef.current.geometry.attributes.position.array
    const colors = pointsRef.current.geometry.attributes.color.array
    const time = state.clock.getElapsedTime()

    if (animationState === 'idle') {
      // Slow rotation
      pointsRef.current.rotation.y = time * 0.15
      
    } else if (animationState === 'explode') {
      // Explosion animation
      explosionProgress.current = Math.min(explosionProgress.current + delta / 1.2, 1)
      
      // EaseOut cubic
      const eased = 1 - Math.pow(1 - explosionProgress.current, 3)
      
      for (let i = 0; i < count; i++) {
        const delay = particleData.delays[i]
        const adjustedProgress = Math.max(0, Math.min(1, (explosionProgress.current - delay) / (1 - delay)))
        const easedProgress = 1 - Math.pow(1 - adjustedProgress, 3)
        
        const velocity = particleData.velocities[i]
        const speed = particleData.speeds[i]
        const explosionDistance = 12 * speed
        
        const i3 = i * 3
        positions[i3] = particleData.positions[i3] + velocity.x * explosionDistance * easedProgress
        positions[i3 + 1] = particleData.positions[i3 + 1] + velocity.y * explosionDistance * easedProgress
        positions[i3 + 2] = particleData.positions[i3 + 2] + velocity.z * explosionDistance * easedProgress
        
        // Store for next phase
        currentPositions.current[i3] = positions[i3]
        currentPositions.current[i3 + 1] = positions[i3 + 1]
        currentPositions.current[i3 + 2] = positions[i3 + 2]
      }
      
      // Shrink particles and add glow
      const sizeMultiplier = 1 - eased * 0.4
      pointsRef.current.material.size = 0.07 * sizeMultiplier
      pointsRef.current.material.opacity = 0.8 + eased * 0.2 // Glow effect
      
      if (explosionProgress.current >= 1) {
        onAnimationComplete()
      }
      
    } else if (animationState === 'formMatrix') {
      // Formation animation
      formationProgress.current = Math.min(formationProgress.current + delta / 2.5, 1)
      
      for (let i = 0; i < count; i++) {
        const delay = particleData.delays[i]
        const adjustedProgress = Math.max(0, Math.min(1, (formationProgress.current - delay * 0.3) / (1 - delay * 0.3)))
        
        const i3 = i * 3
        
        // Smooth lerp to matrix positions
        positions[i3] = THREE.MathUtils.lerp(
          currentPositions.current[i3],
          matrixTargets.targets[i3],
          adjustedProgress
        )
        positions[i3 + 1] = THREE.MathUtils.lerp(
          currentPositions.current[i3 + 1],
          matrixTargets.targets[i3 + 1],
          adjustedProgress
        )
        positions[i3 + 2] = THREE.MathUtils.lerp(
          currentPositions.current[i3 + 2],
          matrixTargets.targets[i3 + 2],
          adjustedProgress
        )
        
        // Transition colors
        colors[i3] = THREE.MathUtils.lerp(
          particleData.colors[i3],
          matrixTargets.targetColors[i3],
          adjustedProgress
        )
        colors[i3 + 1] = THREE.MathUtils.lerp(
          particleData.colors[i3 + 1],
          matrixTargets.targetColors[i3 + 1],
          adjustedProgress
        )
        colors[i3 + 2] = THREE.MathUtils.lerp(
          particleData.colors[i3 + 2],
          matrixTargets.targetColors[i3 + 2],
          adjustedProgress
        )
      }
      
      // Grow particles back
      const size = THREE.MathUtils.lerp(0.07 * 0.6, 0.08, formationProgress.current)
      pointsRef.current.material.size = size
      pointsRef.current.material.opacity = THREE.MathUtils.lerp(1, 0.9, formationProgress.current)
      
      // Subtle floating animation once mostly formed
      if (formationProgress.current >= 0.92) {
        floatTime.current += delta
        
        for (let i = 0; i < count; i++) {
          const i3 = i * 3
          const floatOffset = Math.sin(floatTime.current * 1.5 + i * 0.008) * 0.012
          positions[i3 + 2] = matrixTargets.targets[i3 + 2] + floatOffset
        }
      }
      
      pointsRef.current.geometry.attributes.color.needsUpdate = true
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <Points
      ref={pointsRef}
      positions={particleData.positions}
      colors={particleData.colors}
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

function StartButton({ onStart, visible }) {
  if (!visible) return null

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
          backdropFilter: "blur(6px)",
          transition: "all 0.3s ease"
        }}
        onMouseEnter={(e) => {
          e.target.style.borderColor = "rgba(0,255,136,0.9)"
          e.target.style.boxShadow = "0 0 20px rgba(0,255,136,0.4)"
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = "rgba(0,255,136,0.5)"
          e.target.style.boxShadow = "none"
        }}
      >
        START
      </button>
    </div>
  )
}

/* ================= MAIN ================= */

export default function SortTheBallsBackground() {
  const [animationState, setAnimationState] = useState('idle')

  function handleStart() {
    if (animationState === 'idle') {
      setAnimationState('explode')
    }
  }

  function handleExplosionComplete() {
    setAnimationState('formMatrix')
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
        <EnergySphere 
          animationState={animationState}
          onAnimationComplete={handleExplosionComplete}
        />
      </Canvas>

      <Header />
      <StartButton onStart={handleStart} visible={animationState === 'idle'} />
    </div>
  )
}