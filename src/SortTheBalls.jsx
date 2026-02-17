import React, {
  useRef,
  useMemo,
  useEffect,
  useState,
  useCallback,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";

/* ================= 3D BALL COMPONENT ================= */
function Ball3D({ position, targetPosition, color, isAnimating }) {
  const meshRef = useRef();
  const posRef = useRef(position);

  useFrame(() => {
    if (!meshRef.current) return;

    // Consistent smooth lerp for all states
    const lerpFactor = 0.07;

    posRef.current[0] = THREE.MathUtils.lerp(
      posRef.current[0],
      targetPosition[0],
      lerpFactor,
    );
    posRef.current[1] = THREE.MathUtils.lerp(
      posRef.current[1],
      targetPosition[1],
      lerpFactor,
    );
    posRef.current[2] = THREE.MathUtils.lerp(
      posRef.current[2],
      targetPosition[2],
      lerpFactor,
    );

    meshRef.current.position.set(
      posRef.current[0],
      posRef.current[1],
      posRef.current[2],
    );

    // Gentle rotation during animation
    if (isAnimating) {
      meshRef.current.rotation.x += 0.02;
      meshRef.current.rotation.y += 0.03;
      meshRef.current.rotation.z += 0.01;
    }
  });

  return (
    <mesh ref={meshRef} position={position} castShadow receiveShadow>
      <sphereGeometry args={[0.385, 32, 32]} />
      <meshStandardMaterial
        color={color}
        metalness={0.4}
        roughness={0.3}
        emissive={color}
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

/* ================= 3D MATRIX SCENE ================= */
function Matrix3DScene({ pattern, isAnimating }) {
  const ballPositions = useMemo(() => {
    // Generate 25 grid positions (5x5)
    const positions = [];
    const spacing = 1.6;
    const startX = -3.2;
    const startY = 3.2;

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        positions.push([startX + col * spacing, startY - row * spacing, 0]);
      }
    }
    return positions;
  }, []);

  const ballData = useMemo(() => {
    return pattern.map((color, index) => {
      const gridPos = ballPositions[index];

      // Only use random positions during initial animation
      const randomPos = isAnimating
        ? [
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 15,
          ]
        : gridPos;

      return {
        initialPos: randomPos,
        targetPos: gridPos,
        color: color.hex,
      };
    });
  }, [pattern, ballPositions, isAnimating]);

  const colorMap = {
    "#EF4444": "rgb(239, 68, 68)",
    "#3B82F6": "rgb(59, 130, 246)",
    "#10B981": "rgb(16, 185, 129)",
    "#A855F7": "rgb(168, 85, 247)",
    "#FBBF24": "rgb(251, 191, 36)",
  };

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, 5]} intensity={0.4} color="#06b6d4" />

      {/* 3D Balls */}
      {ballData.map((ball, index) => (
        <Ball3D
          key={index}
          position={ball.initialPos}
          targetPosition={ball.targetPos}
          color={ball.color}
          isAnimating={isAnimating}
        />
      ))}
    </>
  );
}

/* ================= MAIN PARTICLE SYSTEM (TIMER) ================= */
function CountdownParticles({ onTimeUp, isRunning }) {
  const ref = useRef();
  const count = 9000;
  const [displayText, setDisplayText] = useState("30");
  const [audioReady, setAudioReady] = useState(false);
  const intervalRef = useRef(null);

  const tickSound = useMemo(() => {
    const audio = new Audio("/sounds/tick.mp3");
    audio.volume = 0.5;
    return audio;
  }, []);

  const endSound = useMemo(() => {
    const audio = new Audio("/sounds/end.mp3");
    audio.volume = 0.7;
    return audio;
  }, []);

  useEffect(() => {
    const unlockAudio = () => {
      tickSound.volume = 0;
      tickSound
        .play()
        .then(() => {
          tickSound.pause();
          tickSound.currentTime = 0;
          tickSound.volume = 0.5;
          setAudioReady(true);
          console.log("Audio unlocked");
        })
        .catch(() => {});
      window.removeEventListener("click", unlockAudio);
    };

    window.addEventListener("click", unlockAudio);
    return () => {
      window.removeEventListener("click", unlockAudio);
    };
  }, [tickSound]);

  const randomPositions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      arr[i3] = (Math.random() - 0.5) * 100;
      arr[i3 + 1] = (Math.random() - 0.5) * 100;
      arr[i3 + 2] = (Math.random() - 0.5) * 100;
    }
    return arr;
  }, []);

  function createTextShape(text) {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 400;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = "bold 200px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const positions = new Float32Array(count * 3);

    let index = 0;

    for (let y = 0; y < canvas.height; y += 3) {
      for (let x = 0; x < canvas.width; x += 3) {
        const i = (y * canvas.width + x) * 4;

        if (imageData[i] > 200 && index < count) {
          const i3 = index * 3;
          positions[i3] = (x - canvas.width / 2) / 20;
          positions[i3 + 1] = -(y - canvas.height / 2) / 20;
          positions[i3 + 2] = 0;
          index++;
        }
      }
    }

    return positions;
  }

  const [targetPositions, setTargetPositions] = useState(randomPositions);

  useEffect(() => {
    if (!isRunning || !audioReady) return;
    let current = 30;
    setDisplayText("30");
    intervalRef.current = setInterval(() => {
      current--;

      if (current >= 0) {
        setDisplayText(current.toString());
        tickSound.currentTime = 0;
        tickSound.play().catch(() => {});
      }

      if (current === 0) {
        endSound.currentTime = 0;
        endSound.play().catch(() => {});
        setTimeout(() => onTimeUp(), 100);
      }

      if (current < 0) clearInterval(intervalRef.current);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning, audioReady, tickSound, endSound, onTimeUp]);

  useEffect(() => {
    if (!isRunning) setDisplayText("30");
  }, [isRunning]);

  useEffect(() => {
    const shape = createTextShape(displayText);
    setTargetPositions(shape);
  }, [displayText]);

  useFrame(() => {
    if (!ref.current) return;
    const positions = ref.current.geometry.attributes.position.array;
    for (let i = 0; i < count * 3; i++) {
      positions[i] = THREE.MathUtils.lerp(
        positions[i],
        targetPositions[i],
        0.08,
      );
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

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
  );
}

/* ================= PATTERN GENERATOR ================= */
function generateComplexPattern() {
  const colors = [
    { name: "red", hex: "#EF4444", bg: "bg-red-500" },
    { name: "blue", hex: "#3B82F6", bg: "bg-blue-500" },
    { name: "green", hex: "#10B981", bg: "bg-green-500" },
    { name: "purple", hex: "#A855F7", bg: "bg-purple-500" },
    { name: "yellow", hex: "#FBBF24", bg: "bg-yellow-400" },
  ];

  const colorArray = [];
  colors.forEach((color) => {
    for (let i = 0; i < 5; i++) {
      colorArray.push(color);
    }
  });

  for (let pass = 0; pass < 3; pass++) {
    for (let i = colorArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [colorArray[i], colorArray[j]] = [colorArray[j], colorArray[i]];
    }
  }

  return colorArray;
}

/* ================= FULL-SCREEN INTRO WITH 3D BALLS ================= */
function IntroPhase({ pattern, isShuffling }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      {/* 3D Canvas with animated balls */}
      <Canvas
        camera={{ position: [0, 0, 12], fov: 75 }}
        style={{ width: "100%", height: "100%" }}
      >
        <color attach="background" args={["#000000"]} />
        <Matrix3DScene pattern={pattern} isAnimating={isShuffling} />
      </Canvas>

      {/* Text overlay */}
      <div
        className="absolute top-12 text-center pointer-events-none px-4"
        style={{
          opacity: isShuffling ? 0.6 : 1,
          transition: "opacity 0.5s ease-out",
        }}
      >
        <h1
          className="font-bold text-cyan-400 tracking-widest mb-2"
          style={{
            fontSize: "clamp(1.5rem, 5vw, 4rem)",
          }}
        >
          MEMORY MATRIX
        </h1>
        <p className="text-gray-400 text-sm">
          {isShuffling ? "Arranging pattern..." : "See the pattern"}
        </p>
      </div>
    </div>
  );
}

/* ================= SPLIT VIEW: LEFT MATRIX + RIGHT TIMER ================= */
function SplitView({ pattern, gameState, onTimeUp }) {
  const isVisible = gameState === "playing";

  return (
    <div
      className="absolute inset-0 flex flex-col lg:flex-row transition-all duration-[1.1s] ease-out"
      style={{
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? "auto" : "none",
        transition: "opacity 1.1s cubic-bezier(0.25,0.8,0.25,1) 0.5s",
      }}
    >
      {/* LEFT: 3D Matrix Pattern */}
      <div
        className="w-full lg:w-1/2 h-1/2 lg:h-full relative border-b lg:border-b-0 lg:border-r border-cyan-500/10"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateX(0)" : "translateX(-100px)",
          transition: "all 1.1s cubic-bezier(0.25,0.8,0.25,1) 0.7s",
        }}
      >
        <Canvas camera={{ position: [0, 0, 12], fov: 75 }}>
          <color attach="background" args={["#000000"]} />
          <Matrix3DScene pattern={pattern} isAnimating={false} />
        </Canvas>

        {/* Text overlay */}
        <div className="absolute top-8 left-0 right-0 text-center pointer-events-none px-4">
          <h2
            className="font-black tracking-widest"
            style={{
              fontFamily: "'Times New Roman', serif",
              fontStyle: "italic",
              fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
              color: "#06b6d4",
              letterSpacing: "0.05em",
            }}
          >
            ARRANGE THE PATTERN
          </h2>
          <p className="text-gray-500 text-xs mt-2">30 seconds</p>
        </div>
      </div>

      {/* RIGHT: Timer Particle System */}
      <div
        className="w-full lg:w-1/2 h-1/2 lg:h-full relative flex flex-col items-center justify-center"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateX(0)" : "translateX(100px)",
          transition: "all 1.1s cubic-bezier(0.25,0.8,0.25,1) 0.7s",
        }}
      >
        <Canvas camera={{ position: [0, 0, 20], fov: 60 }}>
          <color attach="background" args={["#000000"]} />
          <CountdownParticles onTimeUp={onTimeUp} isRunning={isVisible} />
        </Canvas>
      </div>
    </div>
  );
}

/* ================= TIME UP OVERLAY ================= */
function TimeUpOverlay({ isVisible }) {
  return (
    <div
      className={`
        fixed inset-0 z-50 flex flex-col items-center justify-center
        transition-all duration-300 ease-out
        ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"}
      `}
      style={{
        background:
          "radial-gradient(ellipse at 50% 45%, #1e0040 0%, #0d001f 55%, #000 100%)",
        backdropFilter: isVisible ? "blur(8px)" : "none",
      }}
    >
      {/* Soft ambient glow */}
      <div
        style={{
          position: "absolute",
          width: "clamp(300px, 560px, 80vw)",
          height: "clamp(300px, 560px, 80vw)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(160,0,255,0.22) 0%, transparent 70%)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />

      {/* Ping rings */}
      <div
        style={{
          position: "absolute",
          width: "clamp(250px, 440px, 70vw)",
          height: "clamp(250px, 440px, 70vw)",
          borderRadius: "50%",
          border: "2px solid rgba(180,60,255,0.28)",
          pointerEvents: "none",
          animation: isVisible
            ? "ping 2s cubic-bezier(0,0,0.2,1) infinite"
            : "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "clamp(180px, 310px, 60vw)",
          height: "clamp(180px, 310px, 60vw)",
          borderRadius: "50%",
          border: "1.5px solid rgba(140,40,255,0.2)",
          pointerEvents: "none",
          animation: isVisible
            ? "ping 2s cubic-bezier(0,0,0.2,1) infinite"
            : "none",
          animationDelay: "0.55s",
        }}
      />

      {/* Main text */}
      <div
        className={`
        text-center z-10 transition-all duration-500
        ${isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"}
      `}
      >
        {["TIME", "UP!"].map((word, wi) => (
          <h1
            key={wi}
            className="font-black tracking-widest leading-none select-none"
            style={{
              fontSize: "clamp(3.5rem, 13vw, 9.5rem)",
              color: "#fff",
              textShadow: [
                "0 0 30px rgba(255,0,0,0.95)",
                "0 0 70px rgba(220,0,0,0.65)",
                "0 0 140px rgba(180,0,0,0.4)",
                "3px 0 0 rgba(255,50,50,0.35)",
                "-3px 0 0 rgba(255,100,100,0.3)",
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

      {/* Progress bar */}
      <div
        className="z-10 rounded-full overflow-hidden mt-12"
        style={{
          width: "clamp(200px, 260px, 70vw)",
          height: 3,
          background: "rgba(255,255,255,0.08)",
        }}
      >
        <div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #a855f7, #06b6d4)",
            width: isVisible ? "100%" : "0%",
            transition: isVisible ? "width 10000ms linear" : "width 0ms",
          }}
        />
      </div>

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ================= MAIN GAME PAGE ================= */
export default function GamePage() {
  const navigate = useNavigate();

  const [gameState, setGameState] = useState("intro");
  const [pattern, setPattern] = useState(() => generateComplexPattern());
  const [isShuffling, setIsShuffling] = useState(false);

  // Animation sequence on component mount
  useEffect(() => {
    // Start with shuffle animation
    setIsShuffling(true);

    // After 1.5s, pattern is fixed and state moves to playing
    const timer1 = setTimeout(() => {
      setIsShuffling(false);

      // After another 1.5s (total ~3s), move to split view
      const timer2 = setTimeout(() => {
        setGameState("playing");
      }, 1500);

      return () => clearTimeout(timer2);
    }, 1500);

    return () => clearTimeout(timer1);
  }, []);

  const handleTimeUp = useCallback(() => {
    setGameState("timeup");
    // Redirect after 10 seconds
    setTimeout(() => {
      navigate("/");
    }, 10000);
  }, [navigate]);

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
      {/* Background gradient */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,242,255,0.04) 0%, transparent 70%)",
        }}
      />

      {/* PHASE 1: Full-screen intro with 3D shuffle animation */}
      {gameState === "intro" && (
        <IntroPhase pattern={pattern} isShuffling={isShuffling} />
      )}

      {/* PHASE 2: Split view (left 3D matrix, right timer) */}
      {(gameState === "playing" || gameState === "timeup") && (
        <SplitView
          pattern={pattern}
          gameState={gameState}
          onTimeUp={handleTimeUp}
        />
      )}

      {/* PHASE 3: Time up overlay */}
      <TimeUpOverlay isVisible={gameState === "timeup"} />
    </div>
  );
}
