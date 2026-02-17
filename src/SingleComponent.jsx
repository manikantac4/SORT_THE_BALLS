import React, {
  useRef,
  useMemo,
  useEffect,
  useState,
  useCallback,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

/* ================= CONSTANTS ================= */
const PHASE = {
  LANDING: "landing",
  ZOOMING: "zooming",
  INTRO_SHUFFLE: "introShuffle",
  PLAYING: "playing",
  TIME_UP: "timeup",
};

const TIMING = {
  ZOOM_DURATION: 1200,
  SHUFFLE_DURATION: 1500,
  SHUFFLE_SETTLE: 1500,
  COUNTDOWN_DURATION: 30,
  TIME_UP_DURATION: 10000,
  TIME_UP_CALLBACK_DELAY: 100,
};

const LERP_FACTORS = {
  SPHERE_SCALE: 0.06,
  MATRIX_SCALE: 0.05,
  BALL_POSITION: 0.07,
  COUNTDOWN_MORPH: 0.08,
};

const PARTICLE_COUNTS = {
  STARS_NEAR: 1400,
  STARS_MID: 2400,
  STARS_FAR: 2200,
  SPHERE: 5000,
  COUNTDOWN: 9000,
};

/* ================= DEEP SPACE STARS BACKGROUND ================= */
function DeepSpaceStars() {
  const nearRef = useRef();
  const midRef = useRef();
  const farRef = useRef();

  function createLayer(count, spread, speedMax) {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * spread;
      positions[i3 + 1] = (Math.random() - 0.5) * spread;
      positions[i3 + 2] = (Math.random() - 0.5) * spread;
      speeds[i] = Math.random() < 0.4 ? 0 : Math.random() * speedMax;
    }

    return { positions, speeds };
  }

  const near = useMemo(
    () => createLayer(PARTICLE_COUNTS.STARS_NEAR, 200, 0.015),
    []
  );
  const mid = useMemo(
    () => createLayer(PARTICLE_COUNTS.STARS_MID, 300, 0.008),
    []
  );
  const far = useMemo(
    () => createLayer(PARTICLE_COUNTS.STARS_FAR, 400, 0.003),
    []
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    function animate(ref, layer, sparkleSpeed) {
      if (!ref.current) return;

      const positions = ref.current.geometry.attributes.position.array;

      for (let i = 0; i < layer.speeds.length; i++) {
        const speed = layer.speeds[i];
        if (speed !== 0) {
          const i3 = i * 3;
          positions[i3 + 1] += speed;
          if (positions[i3 + 1] > 200) positions[i3 + 1] = -200;
        }
      }

      ref.current.geometry.attributes.position.needsUpdate = true;
      ref.current.material.opacity = 0.65 + Math.sin(t * sparkleSpeed) * 0.35;
    }

    animate(farRef, far, 0.5);
    animate(midRef, mid, 1.0);
    animate(nearRef, near, 1.8);
  });

  return (
    <>
      <Points ref={farRef} positions={far.positions} stride={3}>
        <PointMaterial
          transparent
          color="#06b6d4"
          size={0.05}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>

      <Points ref={midRef} positions={mid.positions} stride={3}>
        <PointMaterial
          transparent
          color="#22d3ee"
          size={0.12}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>

      <Points ref={nearRef} positions={near.positions} stride={3}>
        <PointMaterial
          transparent
          color="#67e8f9"
          size={0.22}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </>
  );
}

/* ================= ENERGY SPHERE ================= */
function EnergySphere({ phase, onResetScale }) {
  const ref = useRef();
  const count = PARTICLE_COUNTS.SPHERE;

  const { sphere, colors } = useMemo(() => {
    const sphere = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const cyan = new THREE.Color("#06b6d4");

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      const r = 3.5;

      sphere[i3] = r * Math.cos(theta) * Math.sin(phi);
      sphere[i3 + 1] = r * Math.sin(theta) * Math.sin(phi);
      sphere[i3 + 2] = r * Math.cos(phi);

      colors[i3] = cyan.r;
      colors[i3 + 1] = cyan.g;
      colors[i3 + 2] = cyan.b;
    }

    return { sphere, colors };
  }, []);

  // Reset scale immediately when transitioning back to landing
  useEffect(() => {
    if (phase === PHASE.LANDING && ref.current && onResetScale) {
      ref.current.scale.set(1, 1, 1);
      onResetScale();
    }
  }, [phase, onResetScale]);

  useFrame((state) => {
    if (!ref.current) return;

    const time = state.clock.getElapsedTime();
    ref.current.rotation.y = time * 0.15;

    if (phase === PHASE.ZOOMING) {
      ref.current.scale.x += (20 - ref.current.scale.x) * LERP_FACTORS.SPHERE_SCALE;
      ref.current.scale.y += (20 - ref.current.scale.y) * LERP_FACTORS.SPHERE_SCALE;
      ref.current.scale.z += (20 - ref.current.scale.z) * LERP_FACTORS.SPHERE_SCALE;
    } else if (phase === PHASE.LANDING) {
      // Fast recovery if coming from zoomed state
      const currentScale = ref.current.scale.x;
      const lerpSpeed = currentScale > 5 ? 0.15 : LERP_FACTORS.SPHERE_SCALE;
      
      ref.current.scale.x += (1 - ref.current.scale.x) * lerpSpeed;
      ref.current.scale.y += (1 - ref.current.scale.y) * lerpSpeed;
      ref.current.scale.z += (1 - ref.current.scale.z) * lerpSpeed;
    }
  });

  return (
    <Points ref={ref} positions={sphere} colors={colors} stride={3}>
      <PointMaterial
        transparent
        vertexColors
        size={0.07}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

/* ================= 3D BALL COMPONENT ================= */
function Ball3D({ position, targetPosition, color, isAnimating }) {
  const meshRef = useRef();
  const posRef = useRef([...position]);

  useFrame(() => {
    if (!meshRef.current) return;

    posRef.current[0] = THREE.MathUtils.lerp(
      posRef.current[0],
      targetPosition[0],
      LERP_FACTORS.BALL_POSITION
    );
    posRef.current[1] = THREE.MathUtils.lerp(
      posRef.current[1],
      targetPosition[1],
      LERP_FACTORS.BALL_POSITION
    );
    posRef.current[2] = THREE.MathUtils.lerp(
      posRef.current[2],
      targetPosition[2],
      LERP_FACTORS.BALL_POSITION
    );

    meshRef.current.position.set(
      posRef.current[0],
      posRef.current[1],
      posRef.current[2]
    );

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
function Matrix3DScene({ pattern, isAnimating, phase, cameraOffset = 0 }) {
  const groupRef = useRef();

  const ballPositions = useMemo(() => {
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

  useFrame(() => {
    if (!groupRef.current) return;

    const targetScale = 1;
    groupRef.current.scale.x += (targetScale - groupRef.current.scale.x) * LERP_FACTORS.MATRIX_SCALE;
    groupRef.current.scale.y += (targetScale - groupRef.current.scale.y) * LERP_FACTORS.MATRIX_SCALE;
    groupRef.current.scale.z += (targetScale - groupRef.current.scale.z) * LERP_FACTORS.MATRIX_SCALE;

    // Apply camera offset for split view
    groupRef.current.position.x = cameraOffset;
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, 5]} intensity={0.4} color="#06b6d4" />

      {ballData.map((ball, index) => (
        <Ball3D
          key={index}
          position={ball.initialPos}
          targetPosition={ball.targetPos}
          color={ball.color}
          isAnimating={isAnimating}
        />
      ))}
    </group>
  );
}

/* ================= COUNTDOWN PARTICLES ================= */
function CountdownParticles({ onTimeUp, cameraOffset = 0 }) {
  const ref = useRef();
  const groupRef = useRef();
  const count = PARTICLE_COUNTS.COUNTDOWN;
  const [displayText, setDisplayText] = useState("30");
  const [audioReady, setAudioReady] = useState(false);
  const intervalRef = useRef(null);
  const audioUnlockAttemptedRef = useRef(false);

  // Stable audio references - created once and reused
  const audioRef = useRef(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = {
        tick: new Audio("/sounds/tick.mp3"),
        end: new Audio("/sounds/end.mp3"),
      };
      audioRef.current.tick.volume = 0.5;
      audioRef.current.end.volume = 0.7;
    }

    return () => {
      // Cleanup audio on unmount
      if (audioRef.current) {
        audioRef.current.tick.pause();
        audioRef.current.end.pause();
        audioRef.current.tick.src = "";
        audioRef.current.end.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  // Audio unlock - runs once
  useEffect(() => {
    if (audioUnlockAttemptedRef.current) return;

    const unlockAudio = () => {
      if (!audioRef.current) return;

      audioUnlockAttemptedRef.current = true;
      
      const tick = audioRef.current.tick;
      tick.volume = 0;
      tick.play()
        .then(() => {
          tick.pause();
          tick.currentTime = 0;
          tick.volume = 0.5;
          setAudioReady(true);
        })
        .catch((err) => {
          console.warn("Audio unlock failed:", err);
          // Still set ready to allow countdown to work
          setAudioReady(true);
        });
    };

    window.addEventListener("click", unlockAudio, { once: true });

    return () => {
      window.removeEventListener("click", unlockAudio);
    };
  }, []);

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

  const createTextShape = useCallback((text) => {
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
  }, [count]);

  const [targetPositions, setTargetPositions] = useState(randomPositions);

  // Countdown logic - stable dependencies
  useEffect(() => {
    // Always reset display on mount
    setDisplayText("30");

    if (!audioReady) return;

    let current = TIMING.COUNTDOWN_DURATION;
    setDisplayText(String(current));

    intervalRef.current = setInterval(() => {
      current--;

      if (current >= 0) {
        setDisplayText(String(current));
        if (audioRef.current?.tick) {
          audioRef.current.tick.currentTime = 0;
          audioRef.current.tick.play().catch(() => {});
        }
      }

      if (current === 0) {
        if (audioRef.current?.end) {
          audioRef.current.end.currentTime = 0;
          audioRef.current.end.play().catch(() => {});
        }
        // Use timeout to ensure audio plays before callback
        setTimeout(() => {
          onTimeUp();
        }, TIMING.TIME_UP_CALLBACK_DELAY);
      }

      if (current < 0) {
        clearInterval(intervalRef.current);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [audioReady, onTimeUp]);

  // Text shape morphing
  useEffect(() => {
    const shape = createTextShape(displayText);
    setTargetPositions(shape);
  }, [displayText, createTextShape]);

  useFrame(() => {
    if (!ref.current || !groupRef.current) return;

    const positions = ref.current.geometry.attributes.position.array;
    for (let i = 0; i < count * 3; i++) {
      positions[i] = THREE.MathUtils.lerp(
        positions[i],
        targetPositions[i],
        LERP_FACTORS.COUNTDOWN_MORPH
      );
    }
    ref.current.geometry.attributes.position.needsUpdate = true;

    // Apply camera offset for split view
    groupRef.current.position.x = cameraOffset;
  });

  return (
    <group ref={groupRef}>
      <Points ref={ref} positions={randomPositions} stride={3}>
        <PointMaterial
          transparent
          color="#06b6d4"
          size={0.12}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
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

/* ================= LANDING HEADER ================= */
function LandingHeader({ phase }) {
  const visible = phase === PHASE.LANDING;

  return (
    <div
      style={{
        position: "fixed",
        top: "60px",
        width: "100%",
        textAlign: "center",
        fontFamily: "Times New Roman",
        fontSize: "42px",
        color: "#06b6d4",
        letterSpacing: "6px",
        zIndex: 10,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.5s ease-out",
        pointerEvents: "none",
      }}
    >
      MEMORY MATRIX
      <div style={{ marginTop: "10px" }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              width: "5px",
              height: "5px",
              margin: "4px",
              borderRadius: "50%",
              background: "#06b6d4",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ================= START BUTTON ================= */
function StartButton({ onStart, phase }) {
  const visible = phase === PHASE.LANDING;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "120px",
        width: "100%",
        textAlign: "center",
        zIndex: 10,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.5s ease-out",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <button
        onClick={onStart}
        disabled={!visible}
        style={{
          fontFamily: "Times New Roman",
          fontSize: "24px",
          padding: "12px 50px",
          color: "#06b6d4",
          background: "transparent",
          border: "2px solid rgba(6,182,212,0.5)",
          borderRadius: "8px",
          cursor: visible ? "pointer" : "default",
          backdropFilter: "blur(6px)",
        }}
      >
        START
      </button>
    </div>
  );
}

/* ================= INTRO SHUFFLE OVERLAY ================= */
function IntroShuffleOverlay({ phase, isShuffling }) {
  const visible = phase === PHASE.INTRO_SHUFFLE;

  return (
    <div
      className="absolute top-12 left-0 right-0 text-center pointer-events-none px-4"
      style={{
        opacity: visible ? (isShuffling ? 0.6 : 1) : 0,
        transition: "opacity 0.5s ease-out",
        zIndex: 10,
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
  );
}

/* ================= PLAYING OVERLAY ================= */
function PlayingOverlay({ phase }) {
  const visible = phase === PHASE.PLAYING;

  return (
    <div
      className="absolute top-8 left-0 right-0 text-center pointer-events-none px-4"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-20px)",
        transition: "all 1.1s cubic-bezier(0.25,0.8,0.25,1) 0.7s",
        zIndex: 10,
      }}
    >
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
  );
}

/* ================= TIME UP OVERLAY ================= */
function TimeUpOverlay({ visible, onComplete }) {
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!visible) {
      setProgress(0);
      return;
    }

    const startTime = Date.now();
    const duration = TIMING.TIME_UP_DURATION;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }, 50);

    // Separate timeout for completion callback
    const completionTimer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      clearTimeout(completionTimer);
    };
  }, [visible, onComplete]);

  return (
    <div
      className={`
        fixed inset-0 z-50 flex flex-col items-center justify-center
        transition-all duration-300 ease-out
        ${visible ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"}
      `}
      style={{
        background:
          "radial-gradient(ellipse at 50% 45%, #1e0040 0%, #0d001f 55%, #000 100%)",
        backdropFilter: visible ? "blur(8px)" : "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: "clamp(300px, 560px, 80vw)",
          height: "clamp(300px, 560px, 80vw)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(6,182,212,0.22) 0%, transparent 70%)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          width: "clamp(250px, 440px, 70vw)",
          height: "clamp(250px, 440px, 70vw)",
          borderRadius: "50%",
          border: "2px solid rgba(6,182,212,0.28)",
          pointerEvents: "none",
          animation: visible
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
          border: "1.5px solid rgba(6,182,212,0.2)",
          pointerEvents: "none",
          animation: visible
            ? "ping 2s cubic-bezier(0,0,0.2,1) infinite"
            : "none",
          animationDelay: "0.55s",
        }}
      />

      <div
        className={`
        text-center z-10 transition-all duration-500
        ${visible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"}
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
                "0 0 30px rgba(6,182,212,0.95)",
                "0 0 70px rgba(6,182,212,0.65)",
                "0 0 140px rgba(6,182,212,0.4)",
                "3px 0 0 rgba(34,211,238,0.35)",
                "-3px 0 0 rgba(103,232,249,0.3)",
              ].join(", "),
            }}
          >
            {word}
          </h1>
        ))}
        <p
          className="text-lg tracking-widest font-semibold mt-6"
          style={{ color: "rgba(6,182,212,0.85)" }}
        >
          Returning to start…
        </p>
      </div>

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
            background: "linear-gradient(90deg, #06b6d4, #22d3ee)",
            width: `${progress}%`,
            transition: "width 50ms linear",
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

/* ================= SPLIT VIEW CONTAINER ================= */
function SplitViewContainer({ phase }) {
  const visible = phase === PHASE.PLAYING;

  return (
    <div
      className="absolute inset-0"
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 1.1s cubic-bezier(0.25,0.8,0.25,1) 0.5s",
      }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1/2 border-r border-cyan-500/10"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateX(0)" : "translateX(-100px)",
          transition: "all 1.1s cubic-bezier(0.25,0.8,0.25,1) 0.7s",
        }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-1/2"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateX(0)" : "translateX(100px)",
          transition: "all 1.1s cubic-bezier(0.25,0.8,0.25,1) 0.7s",
        }}
      />
    </div>
  );
}

/* ================= MAIN UNIFIED COMPONENT ================= */
export default function UnifiedMemoryMatrix() {
  const [phase, setPhase] = useState(PHASE.LANDING);
  const [pattern, setPattern] = useState(() => generateComplexPattern());
  const [isShuffling, setIsShuffling] = useState(false);
  
  // Refs to track and cleanup all timers
  const timersRef = useRef({
    zoom: null,
    shuffle: null,
    settle: null,
  });

  // Cleanup all pending timers
  const cleanupTimers = useCallback(() => {
    Object.values(timersRef.current).forEach((timer) => {
      if (timer !== null) {
        clearTimeout(timer);
      }
    });
    timersRef.current = { zoom: null, shuffle: null, settle: null };
  }, []);

  // Handle START button with proper timer management
  const handleStart = useCallback(() => {
    // Clear any existing timers first
    cleanupTimers();

    setPhase(PHASE.ZOOMING);

    timersRef.current.zoom = setTimeout(() => {
      setPhase(PHASE.INTRO_SHUFFLE);
      setIsShuffling(true);

      timersRef.current.shuffle = setTimeout(() => {
        setIsShuffling(false);

        timersRef.current.settle = setTimeout(() => {
          setPhase(PHASE.PLAYING);
          // Clear timer refs after successful transition
          timersRef.current = { zoom: null, shuffle: null, settle: null };
        }, TIMING.SHUFFLE_SETTLE);
      }, TIMING.SHUFFLE_DURATION);
    }, TIMING.ZOOM_DURATION);
  }, [cleanupTimers]);

  // Stable callback for countdown completion
  const handleTimeUp = useCallback(() => {
    cleanupTimers();
    setPhase(PHASE.TIME_UP);
  }, [cleanupTimers]);

  // Stable callback for time up overlay completion
  const handleTimeUpComplete = useCallback(() => {
    setPattern(generateComplexPattern());
    setPhase(PHASE.LANDING);
    setIsShuffling(false);
  }, []);

  // Stable callback for sphere reset
  const handleSphereReset = useCallback(() => {
    // Callback when sphere scale is reset
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      cleanupTimers();
    };
  }, [cleanupTimers]);

  // Calculate camera offsets for split view
  const matrixOffset = phase === PHASE.PLAYING ? -5 : 0;
  const countdownOffset = phase === PHASE.PLAYING ? 5 : 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
      }}
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(6,182,212,0.04) 0%, transparent 70%)",
        }}
      />

      {/* Main 3D Canvas */}
      <Canvas
        style={{
          position: "absolute",
          inset: 0,
        }}
        camera={{ position: [0, 0, 20], fov: 60 }}
      >
        <color attach="background" args={["#000000"]} />

        {/* Always-present background stars */}
        <DeepSpaceStars />

        {/* Energy sphere - ONLY mount during landing and zooming */}
        {(phase === PHASE.LANDING || phase === PHASE.ZOOMING) && (
          <EnergySphere phase={phase} onResetScale={handleSphereReset} />
        )}

        {/* 3D Matrix - ONLY mount during intro and playing */}
        {(phase === PHASE.INTRO_SHUFFLE || phase === PHASE.PLAYING) && (
          <Matrix3DScene
            pattern={pattern}
            isAnimating={isShuffling}
            phase={phase}
            cameraOffset={matrixOffset}
          />
        )}

        {/* Countdown particles - ONLY mount during playing */}
        {phase === PHASE.PLAYING && (
          <CountdownParticles
            onTimeUp={handleTimeUp}
            cameraOffset={countdownOffset}
          />
        )}
      </Canvas>

      {/* UI Overlays */}
      <LandingHeader phase={phase} />
      <StartButton onStart={handleStart} phase={phase} />
      <IntroShuffleOverlay phase={phase} isShuffling={isShuffling} />
      <PlayingOverlay phase={phase} />
      <SplitViewContainer phase={phase} />
      <TimeUpOverlay
        visible={phase === PHASE.TIME_UP}
        onComplete={handleTimeUpComplete}
      />
    </div>
  );
}