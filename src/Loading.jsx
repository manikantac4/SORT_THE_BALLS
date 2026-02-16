import React, { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import gsap from "gsap"
import SplitType from "split-type"



const phases = ["READY", "GET", "SET", "GO"]

const colors = ["GREEN", "BLUE", "RED", "WHITE", "YELLOW"]



export default function Loading() {

  const navigate = useNavigate()

  const textRef = useRef()

  const colorRefs = useRef([])

  const gun = useRef(null)



  useEffect(() => {

    gun.current = new Audio("/sounds/gun.mp3")



    const tl = gsap.timeline()



    /* READY GET SET GO animation */

    phases.forEach((word, i) => {

      tl.call(() => {

        textRef.current.innerHTML = word

        const split = new SplitType(textRef.current, {
          types: "chars"
        })

        gun.current.currentTime = 0
        gun.current.play().catch(()=>{})

        gsap.fromTo(
          split.chars,
          {
            opacity: 0,
            y: 100,
            scale: 0.5
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.05,
            ease: "power3.out"
          }
        )

      })

      tl.to({}, { duration: 1.5 })

      tl.to(textRef.current, {
        opacity: 0,
        duration: 0.4
      })

      tl.set(textRef.current, { opacity: 1 })

    })



    /* COLOR DECIDING ANIMATION */

    tl.call(() => {

      colorRefs.current.forEach((el, i) => {

        gsap.fromTo(
          el,
          {
            opacity: 0,
            scale: 0,
            rotation: 180
          },
          {
            opacity: 1,
            scale: 1,
            rotation: 0,
            duration: 1,
            ease: "elastic.out(1,0.5)"
          }
        )

        gsap.to(el, {
          x: () => Math.random() * 400 - 200,
          y: () => Math.random() * 300 - 150,
          rotation: () => Math.random() * 360,
          duration: 2,
          ease: "power2.inOut"
        })

      })

    })



    tl.to({}, { duration: 3 })



    tl.call(() => {

      navigate("/game")

    })



  }, [])



  return (

    <div className="fixed inset-0 bg-black overflow-hidden">

      {/* dynamic dark green background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, rgba(0,255,100,0.2), black 70%)",
          animation: "pulseBg 3s infinite alternate"
        }}
      />



      {/* READY GET SET GO */}
      <div
        ref={textRef}
        className="absolute text-green-400"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: "90px",
          fontFamily: "Times New Roman",
          letterSpacing: "12px"
        }}
      />



      {/* COLORS */}
      {colors.map((color, i) => (

        <div
          key={i}
          ref={el => colorRefs.current[i] = el}
          className="absolute text-green-400"
          style={{
            top: "50%",
            left: "50%",
            fontSize: "36px",
            fontFamily: "Times New Roman",
            opacity: 0
          }}
        >
          {color}
        </div>

      ))}



      {/* injected animation */}
      <style>
        {`
          @keyframes pulseBg {
            from { opacity: 0.2; }
            to { opacity: 0.4; }
          }
        `}
      </style>

    </div>

  )

}
