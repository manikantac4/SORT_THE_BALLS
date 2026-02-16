import React, { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"



const words = ["READY", "GET", "SET", "GO"]

const colors = ["GREEN", "BLUE", "RED", "WHITE", "YELLOW"]



export default function Loading() {

  const navigate = useNavigate()

  const [phase, setPhase] = useState(0)

  const [showBoxes, setShowBoxes] = useState(false)

  const gunSound = useRef(null)



  /* inject keyframes dynamically */
  useEffect(() => {

    const style = document.createElement("style")

    style.innerHTML = `

      @keyframes spinBox {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      @keyframes glowPulse {
        0% { opacity: 0.2; transform: scale(1); }
        100% { opacity: 0.5; transform: scale(1.2); }
      }

      @keyframes wordAppear {
        0% { opacity: 0; transform: translate(-50%, -60%) scale(0.8); }
        100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      }

    `

    document.head.appendChild(style)

    return () => document.head.removeChild(style)

  }, [])



  /* sound and phase control */
  useEffect(() => {

    gunSound.current = new Audio("/sounds/gun.mp3")

    let i = 0

    const interval = setInterval(() => {

      if (i < 4) {

        setPhase(i)

        gunSound.current.currentTime = 0
        gunSound.current.play().catch(()=>{})

        i++

      }
      else {

        clearInterval(interval)

        setTimeout(() => setShowBoxes(true), 500)

        setTimeout(() => navigate("/game"), 5000)

      }

    }, 1000)

    return () => clearInterval(interval)

  }, [])



  return (

    <div className="fixed inset-0 bg-black overflow-hidden">

      {/* dynamic dark green glow background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, rgba(0,255,100,0.15), black 70%)",
          animation: "glowPulse 3s infinite alternate"
        }}
      />


      {/* READY GET SET GO text */}
      {!showBoxes && (

        <div
          className="absolute text-green-400"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "80px",
            fontFamily: "Times New Roman",
            letterSpacing: "12px",
            animation: "wordAppear 0.5s ease"
          }}
        >

          {words[phase]}

        </div>

      )}


      {/* spinning boxes */}
      {showBoxes && (

        <>
          {Array.from({ length: 5 }).map((_, i) => (
            <SpinBox key={i} />
          ))}
        </>

      )}

    </div>

  )

}



/* ================= SPIN BOX ================= */

function SpinBox() {

  const [text, setText] = useState(colors[0])

  const [position] = useState({
    x: Math.random() * window.innerWidth * 0.8,
    y: Math.random() * window.innerHeight * 0.8
  })



  useEffect(() => {

    const interval = setInterval(() => {

      setText(
        colors[
          Math.floor(Math.random() * colors.length)
        ]
      )

    }, 150)

    setTimeout(() => clearInterval(interval), 2500)

  }, [])



  return (

    <div
      className="absolute border border-green-400 flex items-center justify-center text-green-400"
      style={{

        left: position.x,
        top: position.y,

        width: "140px",
        height: "140px",

        fontFamily: "Times New Roman",
        fontSize: "22px",

        animation: "spinBox 2s linear infinite",

        boxShadow: "0 0 20px rgba(0,255,136,0.5)"

      }}
    >

      {text}

    </div>

  )

}
