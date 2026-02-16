import React, { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"



const phases = ["READY", "GET", "SET", "GO"]



/* fixed positions around screen */
const boxPositions = [

  { top: "8%", left: "8%" },       // top left
  { bottom: "8%", left: "8%" },    // bottom left
  { top: "8%", right: "8%" },      // top right
  { bottom: "8%", right: "8%" },   // bottom right
  { top: "40%", right: "4%" }      // mid right

]



export default function Loading() {

  const navigate = useNavigate()

  const [phaseIndex, setPhaseIndex] = useState(0)

  const gunSound = useRef(null)



  /* inject animations */
  useEffect(() => {

    const style = document.createElement("style")

    style.innerHTML = `

      @keyframes spinBox {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      @keyframes bgGlow {
        0% { opacity: 0.15; }
        100% { opacity: 0.35; }
      }

      @keyframes textFade {
        0% { opacity: 0; transform: scale(0.7); }
        100% { opacity: 1; transform: scale(1); }
      }

    `

    document.head.appendChild(style)

    return () => document.head.removeChild(style)

  }, [])



  /* phase sequence */
  useEffect(() => {

    gunSound.current = new Audio("/sounds/gun.mp3")

    let index = 0

    const interval = setInterval(() => {

      if (index < phases.length) {

        setPhaseIndex(index)

        gunSound.current.currentTime = 0
        gunSound.current.play().catch(()=>{})

        index++

      }
      else {

        clearInterval(interval)

        setTimeout(() => {

          navigate("/game")

        }, 1000)

      }

    }, 1500)

    return () => clearInterval(interval)

  }, [])



  return (

    <div className="fixed inset-0 bg-black overflow-hidden">

      {/* dynamic dark green background glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, rgba(0,255,120,0.2), black 70%)",
          animation: "bgGlow 3s infinite alternate"
        }}
      />



      {/* 5 spinning boxes always visible */}
      {boxPositions.map((pos, i) => (

        <div
          key={i}
          className="absolute border border-green-400 flex items-center justify-center text-green-400"
          style={{

            width: "140px",
            height: "140px",

            fontFamily: "Times New Roman",
            fontSize: "22px",

            animation: "spinBox 2s linear infinite",

            boxShadow: "0 0 20px rgba(0,255,136,0.5)",

            ...pos

          }}
        >

          <div
            style={{
              animation: "textFade 0.3s ease"
            }}
          >
            {phases[Math.min(phaseIndex, phases.length - 1)]}
          </div>

        </div>

      ))}

    </div>

  )

}
