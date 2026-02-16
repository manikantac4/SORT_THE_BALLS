import React, { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"



const phases = ["READY", "GET", "SET", "GO"]



export default function Loading() {

  const navigate = useNavigate()

  const [phaseIndex, setPhaseIndex] = useState(-1)

  const gunSound = useRef(null)



  /* inject animation styles */
  useEffect(() => {

    const style = document.createElement("style")

    style.innerHTML = `

      @keyframes glowBg {
        0% { opacity: 0.15; }
        100% { opacity: 0.35; }
      }

      @keyframes dashIn {
        0% {
          transform: translateY(-200px) scale(0.5);
          opacity: 0;
          filter: blur(10px);
        }
        100% {
          transform: translateY(0px) scale(1);
          opacity: 1;
          filter: blur(0px);
        }
      }

      @keyframes dashOut {
        0% {
          transform: translateY(0px) scale(1);
          opacity: 1;
          filter: blur(0px);
        }
        100% {
          transform: translateY(200px) scale(0.5);
          opacity: 0;
          filter: blur(10px);
        }
      }

    `

    document.head.appendChild(style)

    return () => document.head.removeChild(style)

  }, [])



  /* phase control */
  useEffect(() => {

    gunSound.current = new Audio("/sounds/gun.mp3")

    let index = 0

    const interval = setInterval(() => {

      if (index < phases.length) {

        setPhaseIndex(index)

        // play gun sound
        gunSound.current.currentTime = 0
        gunSound.current.play().catch(()=>{})

        index++

      }
      else {

        clearInterval(interval)

        setTimeout(() => {

          navigate("/game")

        }, 200)

      }

    }, 700)

    return () => clearInterval(interval)

  }, [])



  return (

    <div className="fixed inset-0 bg-black overflow-hidden flex items-center justify-center">

      {/* dynamic dark green glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, rgba(0,255,120,0.25), black 70%)",
          animation: "glowBg 3s infinite alternate"
        }}
      />



      {/* phase text */}
      {phaseIndex >= 0 && (

        <div
          key={phaseIndex}
          style={{
            fontFamily: "Times New Roman",
            fontSize: "120px",
            color: "#00ff88",
            letterSpacing: "12px",
            animation: `
              dashIn 0.25s ease-out,
              dashOut 0.25s ease-in 0.45s forwards
            `,
            textShadow: "0 0 25px rgba(0,255,136,0.7)"
          }}
        >
          {phases[phaseIndex]}
        </div>

      )}

    </div>

  )

}
