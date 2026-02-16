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

// EaseInOut cubic
const easeInOutCubic = (t) => {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// EaseOut cubic
const easeOutCubic = (t) => {
  return 1 - Math.pow(1 - t, 3)
}

/* ================= ENERGY SPHERE WITH MAGNETIC COLLAPSE ================= */

function EnergySphere({ animationState, onCollapseComplete }) {
  const pointsRef = useRef()
  const count = 5000
  
  const explosionProgress = useRef(0)
  const collapseProgress = useRef(0)
  const idleRotation = useRef(0)

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

  // Collapse targets - each particle assigned to a grid center
  const collapseTargets = useMemo(() => {
    const targets = []
    const gridSize = 5
    const spacing = 1.4
    const particlesPerCell = count / 25 // 200 particles per cell
    
    let particleIndex = 0
    
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const centerX = (col - gridSize / 2 + 0.5) * spacing
        const centerY = (row - gridSize / 2 + 0.5) * spacing
        const centerZ = 0
        
        // Assign particles to this grid center
        for (let p = 0; p < particlesPerCell; p++) {
          targets.push(new THREE.Vector3(centerX, centerY, centerZ))
          particleIndex++
        }
      }
    }
    
    return targets
  }, [])

  // Store explosion positions for collapse phase
  const explosionPositions = useRef(new Float32Array(count * 3))

  useFrame((state, delta) => {
    if (!pointsRef.current) return
    
    const positions = pointsRef.current.geometry.attributes.position.array
    const time = state.clock.getElapsedTime()

    if (animationState === 'idle') {
      // Slow rotation
      idleRotation.current = time * 0.15
      pointsRef.current.rotation.y = idleRotation.current
      
    } else if (animationState === 'explode') {
      // Explosion animation
      explosionProgress.current = Math.min(explosionProgress.current + delta / 1.2, 1)
      
      for (let i = 0; i < count; i++) {
        const delay = particleData.delays[i]
        const adjustedProgress = Math.max(0, Math.min(1, (explosionProgress.current - delay) / (1 - delay)))
        const easedProgress = easeOutCubic(adjustedProgress)
        
        const velocity = particleData.velocities[i]
        const speed = particleData.speeds[i]
        const explosionDistance = 12 * speed
        
        const i3 = i * 3
        positions[i3] = particleData.positions[i3] + velocity.x * explosionDistance * easedProgress
        positions[i3 + 1] = particleData.positions[i3 + 1] + velocity.y * explosionDistance * easedProgress
        positions[i3 + 2] = particleData.positions[i3 + 2] + velocity.z * explosionDistance * easedProgress
        
        // Store final explosion positions
        if (explosionProgress.current >= 1) {
          explosionPositions.current[i3] = positions[i3]
          explosionPositions.current[i3 + 1] = positions[i3 + 1]
          explosionPositions.current[i3 + 2] = positions[i3 + 2]
        }
      }
      
      // Shrink particles slightly
      const eased = easeOutCubic(explosionProgress.current)
      const sizeMultiplier = 1 - eased * 0.3
      pointsRef.current.material.size = 0.07 * sizeMultiplier
      pointsRef.current.material.opacity = 0.8 + eased * 0.2
      
    } else if (animationState === 'collapse') {
      // Magnetic collapse animation
      collapseProgress.current = Math.min(collapseProgress.current + delta / 1.5, 1)
      
      const easedCollapse = easeInOutCubic(collapseProgress.current)
      
      for (let i = 0; i < count; i++) {
        const delay = particleData.delays[i] * 0.2 // Subtle stagger
        const adjustedProgress = Math.max(0, Math.min(1, (collapseProgress.current - delay) / (1 - delay)))
        const easedProgress = easeInOutCubic(adjustedProgress)
        
        const i3 = i * 3
        const target = collapseTargets[i]
        
        // Lerp from explosion position to collapse target
        positions[i3] = THREE.MathUtils.lerp(
          explosionPositions.current[i3],
          target.x,
          easedProgress
        )
        positions[i3 + 1] = THREE.MathUtils.lerp(
          explosionPositions.current[i3 + 1],
          target.y,
          easedProgress
        )
        positions[i3 + 2] = THREE.MathUtils.lerp(
          explosionPositions.current[i3 + 2],
          target.z,
          easedProgress
        )
      }
      
      // Gradually reduce size and opacity during collapse
      const shrinkStart = 0.3 // Start shrinking at 30% progress
      const shrinkProgress = Math.max(0, (easedCollapse - shrinkStart) / (1 - shrinkStart))
      
      pointsRef.current.material.size = THREE.MathUtils.lerp(0.07 * 0.7, 0.02, shrinkProgress)
      pointsRef.current.material.opacity = THREE.MathUtils.lerp(1, 0, shrinkProgress)
      
      // Trigger sphere emergence at 80%
      if (collapseProgress.current >= 1) {
        onCollapseComplete()
      }
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

/* ================= INSTANCED SPHERE MATRIX ================= */

function SphereMatrix({ animationState }) {
  const meshRef = useRef()
  const count = 25
  const gridSize = 5
  const spacing = 1.4
  
  const emergenceProgress = useRef(0)
  const floatTime = useRef(0)
  const hasStartedEmerging = useRef(false)

  // Grid data with colors
  const gridData = useMemo(() => {
    const colorPalette = createColorPalette()
    const positions = []
    const colors = []
    
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const x = (col - gridSize / 2 + 0.5) * spacing
        const y = (row - gridSize / 2 + 0.5) * spacing
        const z = 0
        
        positions.push(new THREE.Vector3(x, y, z))
        colors.push(colorPalette[row * gridSize + col])
      }
    }
    
    return { positions, colors }
  }, [])

  useFrame((state, delta) => {
    if (!meshRef.current) return
    
    const time = state.clock.getElapsedTime()
    
    if (animationState === 'matrix') {
      if (!hasStartedEmerging.current) {
        hasStartedEmerging.current = true
      }
      
      // Emergence animation
      emergenceProgress.current = Math.min(emergenceProgress.current + delta / 1.0, 1)
      
      const easedEmergence = easeInOutCubic(emergenceProgress.current)
      
      // Update each sphere instance
      const tempMatrix = new THREE.Matrix4()
      const tempColor = new THREE.Color()
      
      for (let i = 0; i < count; i++) {
        const position = gridData.positions[i]
        const color = gridData.colors[i]
        
        // Scale from 0 to 1
        const scale = easedEmergence * 0.35
        
        tempMatrix.makeScale(scale, scale, scale)
        tempMatrix.setPosition(position.x, position.y, position.z)
        
        meshRef.current.setMatrixAt(i, tempMatrix)
        
        // Set color
        tempColor.copy(color)
        meshRef.current.setColorAt(i, tempColor)
      }
      
      meshRef.current.instanceMatrix.needsUpdate = true
      if (meshRef.current.instanceColor) {
        meshRef.current.instanceColor.needsUpdate = true
      }
      
      // Subtle group float after full emergence
      if (emergenceProgress.current >= 1) {
        floatTime.current += delta
        const floatOffset = Math.sin(floatTime.current * 0.8) * 0.15
        meshRef.current.position.z = floatOffset
      }
    }
  })

  // Initialize instances
  useMemo(() => {
    if (meshRef.current) {
      const tempMatrix = new THREE.Matrix4()
      tempMatrix.makeScale(0, 0, 0)
      
      for (let i = 0; i < count; i++) {
        meshRef.current.setMatrixAt(i, tempMatrix)
      }
      
      meshRef.current.instanceMatrix.needsUpdate = true
    }
  }, [])

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial
        roughness={0.4}
        metalness={0.2}
        emissive="#111111"
        emissiveIntensity={0.3}
      />
    </instancedMesh>
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

/* ================= SCENE CONTROLLER ================= */

function Scene() {
  const [animationState, setAnimationState] = useState('idle')
  const stateChangeTriggered = useRef({
    collapse: false,
    matrix: false
  })

  function handleStart() {
    if (animationState === 'idle') {
      setAnimationState('explode')
      
      // Trigger collapse after explosion duration
      setTimeout(() => {
        if (!stateChangeTriggered.current.collapse) {
          stateChangeTriggered.current.collapse = true
          setAnimationState('collapse')
        }
      }, 1200)
    }
  }

  function handleCollapseComplete() {
    if (!stateChangeTriggered.current.matrix) {
      stateChangeTriggered.current.matrix = true
      setAnimationState('matrix')
    }
  }

  return (
    <>
      <DeepSpaceStars />
      
      {/* Particles - visible during idle, explode, and collapse */}
      {animationState !== 'matrix' && (
        <EnergySphere 
          animationState={animationState}
          onCollapseComplete={handleCollapseComplete}
        />
      )}
      
      {/* Spheres - only emerge during matrix state */}
      <SphereMatrix animationState={animationState} />
      
      {/* Lighting for spheres */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <pointLight position={[-10, -10, -5]} intensity={0.3} color="#00ff88" />
      
      {/* UI overlays */}
      <Html>
        <Header />
        <StartButton onStart={handleStart} visible={animationState === 'idle'} />
      </Html>
    </>
  )
}

/* ================= HTML WRAPPER ================= */

function Html({ children }) {
  return <div>{children}</div>
}

/* ================= MAIN ================= */

export default function SortTheBallsBackground() {
  const [animationState, setAnimationState] = useState('idle')
  const stateChangeTriggered = useRef({
    collapse: false,
    matrix: false
  })

  function handleStart() {
    if (animationState === 'idle') {
      setAnimationState('explode')
      
      // Trigger collapse after explosion duration
      setTimeout(() => {
        if (!stateChangeTriggered.current.collapse) {
          stateChangeTriggered.current.collapse = true
          setAnimationState('collapse')
        }
      }, 1200)
    }
  }

  function handleCollapseComplete() {
    if (!stateChangeTriggered.current.matrix) {
      stateChangeTriggered.current.matrix = true
      setAnimationState('matrix')
    }
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
        
        {/* Particles - visible during idle, explode, and collapse */}
        {animationState !== 'matrix' && (
          <EnergySphere 
            animationState={animationState}
            onCollapseComplete={handleCollapseComplete}
          />
        )}
        
        {/* Spheres - emerge during matrix state */}
        <SphereMatrix animationState={animationState} />
        
        {/* Lighting for spheres */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <pointLight position={[-10, -10, -5]} intensity={0.3} color="#00ff88" />
      </Canvas>

      <Header />
      <StartButton onStart={handleStart} visible={animationState === 'idle'} />
    </div>
  )
}