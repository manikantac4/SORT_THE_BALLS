import React from "react"

export default function FullscreenButton() {

  const enterFullscreen = () => {

    const element = document.documentElement

    if (element.requestFullscreen) {
      element.requestFullscreen()
    }
    else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen()
    }
    else if (element.msRequestFullscreen) {
      element.msRequestFullscreen()
    }

  }

  return (
    <div
      onClick={enterFullscreen}
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 9999,
        cursor: "pointer",
        background: "rgba(0,0,0,0.6)",
        borderRadius: "10px",
        padding: "10px",
        border: "1px solid cyan"
      }}
    >
      {/* fullscreen icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="26"
        height="26"
        fill="cyan"
        viewBox="0 0 24 24"
      >
        <path d="M7 14H5v5h5v-2H7v-3zm0-4h2V7h3V5H5v5zm10 9h-3v2h5v-5h-2v3zm0-14v3h2V5h-5v2h3z"/>
      </svg>
    </div>
  )

}
