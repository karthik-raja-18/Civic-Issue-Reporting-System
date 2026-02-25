import { useState, useRef, useEffect, useCallback } from 'react'

/**
 * EvidenceCapture — Forces user to take a LIVE photo.
 * Embeds GPS + timestamp watermark on captured image.
 *
 * Props:
 *   onCapture(payload)       — { file, timestamp, location }
 *   onLocationCapture(loc)   — { latitude, longitude, accuracy }
 */
export default function EvidenceCapture({ onCapture, onLocationCapture }) {
  const videoRef   = useRef(null)
  const canvasRef  = useRef(null)
  const streamRef  = useRef(null)

  const [phase,    setPhase]    = useState('idle')
  // idle | locating | camera | captured | error
  const [location, setLocation] = useState(null)
  const [captured, setCaptured] = useState(null) // { previewUrl, file, timestamp }
  const [error,    setError]    = useState(null)

  // ── Stop stream helper ────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  // ── Step 1: Get GPS ───────────────────────────────────────────────
  const requestLocation = useCallback(() => {
    setPhase('locating')
    setError(null)

    if (!navigator.geolocation) {
      // GPS not available — skip GPS, go straight to camera
      startCamera()
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const loc = {
          latitude:  coords.latitude,
          longitude: coords.longitude,
          accuracy:  Math.round(coords.accuracy),
        }
        setLocation(loc)
        onLocationCapture?.(loc)
        startCamera()
      },
      () => {
        // GPS denied — still allow camera, just no GPS data
        setLocation(null)
        startCamera()
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [onLocationCapture])

  // ── Step 2: Open rear camera ──────────────────────────────────────
  const startCamera = useCallback(async () => {
    setPhase('camera')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // rear cam on mobile
          width:      { ideal: 1280 },
          height:     { ideal: 720  },
        },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera access in your browser.')
      setPhase('error')
    }
  }, [])

  // ── Step 3: Capture photo + draw watermark ────────────────────────
  const capturePhoto = useCallback(() => {
  const video  = videoRef.current
  const canvas = canvasRef.current
  if (!video || !canvas) return

  const now = new Date()

  // ✅ Fix 2 — Resize to max 800px wide (reduces 3MB → ~200KB)
  const MAX_WIDTH = 800
  const scale     = Math.min(1, MAX_WIDTH / (video.videoWidth || 1280))
  canvas.width    = (video.videoWidth  || 1280) * scale
  canvas.height   = (video.videoHeight || 720)  * scale

  const ctx = canvas.getContext('2d')
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  drawWatermark(ctx, canvas.width, canvas.height, now)

  // ✅ Fix 2 — Quality 0.6 = good evidence quality, small file
  canvas.toBlob((blob) => {
    const file       = new File([blob], `evidence_${Date.now()}.jpg`, { type: 'image/jpeg' })
    const previewUrl = URL.createObjectURL(blob)
    const timestamp  = now.toISOString()

    console.log(`📸 Photo size: ${(blob.size / 1024).toFixed(1)} KB`)

    setCaptured({ file, previewUrl, timestamp })
    onCapture?.({ file, timestamp, location })
    stopCamera()
    setPhase('captured')
  }, 'image/jpeg', 0.6)  // ✅ 0.6 = compressed
}, [location, onCapture, stopCamera])

  // ── Watermark drawing ─────────────────────────────────────────────
  const drawWatermark = (ctx, w, h, now) => {
    const dateStr = now.toLocaleString('en-IN', {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    })
    const locStr = location
      ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
      : 'GPS unavailable'

    const lines = [
      'CivicPulse — Live Evidence',
      `Date: ${dateStr}`,
      `GPS:  ${locStr}`,
    ]

    const barH   = 90
    const fontSize = Math.max(13, Math.round(w / 85))

    // Dark bar
    ctx.fillStyle = 'rgba(0,0,0,0.72)'
    ctx.fillRect(0, h - barH, w, barH)

    // Green left border
    ctx.fillStyle = '#22c55e'
    ctx.fillRect(0, h - barH, 5, barH)

    // Text
    ctx.font      = `bold ${fontSize}px monospace`
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'left'
    lines.forEach((line, i) => {
      ctx.fillText(line, 14, h - barH + 24 + i * (fontSize + 6))
    })

    // LIVE badge
    ctx.fillStyle = 'rgba(220,38,38,0.90)'
    ctx.fillRect(w - 140, 10, 130, 30)
    ctx.fillStyle = '#fff'
    ctx.font      = `bold 12px monospace`
    ctx.textAlign = 'right'
    ctx.fillText('● LIVE EVIDENCE', w - 14, 30)
  }

  // ── Retake ────────────────────────────────────────────────────────
  const retake = () => {
    setCaptured(null)
    setPhase('idle')
    setError(null)
  }

  // ── RENDER ────────────────────────────────────────────────────────
  return (
    <div className="rounded-xl border border-ink-700 bg-ink-900 overflow-hidden">

      {/* IDLE */}
      {phase === 'idle' && (
        <div className="flex flex-col items-center justify-center py-8 px-6 text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-civic-500/15 border border-civic-500/30
                          flex items-center justify-center">
            <CamIcon className="w-7 h-7 text-civic-400" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">Take Live Evidence Photo</p>
            <p className="text-ink-400 text-xs mt-1">
              Required before submitting. GPS + timestamp will be embedded.
            </p>
          </div>
          <ul className="text-xs text-ink-500 space-y-1 text-left w-full max-w-xs">
            <li className="flex gap-1.5"><span className="text-civic-500">✓</span> No gallery uploads — must be live</li>
            <li className="flex gap-1.5"><span className="text-civic-500">✓</span> GPS auto-fills location</li>
            <li className="flex gap-1.5"><span className="text-civic-500">✓</span> Watermark added automatically</li>
          </ul>
          <button onClick={requestLocation} className="btn-primary gap-2">
            <CamIcon className="w-4 h-4" /> Open Camera
          </button>
        </div>
      )}

      {/* LOCATING */}
      {phase === 'locating' && (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-ink-700 border-t-civic-500 animate-spin" />
          <p className="text-ink-300 text-sm">Getting your location…</p>
          <p className="text-ink-500 text-xs">Allow location access when prompted</p>
        </div>
      )}

      {/* LIVE CAMERA */}
      {phase === 'camera' && (
        <div className="relative bg-black">
          <video
            ref={videoRef}
            className="w-full max-h-72 object-cover block"
            autoPlay playsInline muted
          />
          {/* LIVE badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600/90
                          text-white text-xs font-bold px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
          </div>
          {/* GPS overlay */}
          {location && (
            <div className="absolute top-3 right-3 bg-black/60 text-white
                            text-xs px-2 py-1 rounded-lg font-mono">
              📍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </div>
          )}
          {/* Capture button */}
          <div className="absolute bottom-4 inset-x-0 flex justify-center">
            <button
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full bg-white border-4 border-civic-500
                         shadow-xl hover:scale-105 active:scale-95 transition-transform"
            >
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-civic-500" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* CAPTURED — preview */}
      {phase === 'captured' && captured && (
        <div>
          <div className="relative">
            {/* ✅ The actual preview image — visible to user immediately */}
            <img
              src={captured.previewUrl}
              alt="Captured evidence"
              className="w-full max-h-72 object-cover block"
            />
            <div className="absolute top-3 left-3 flex items-center gap-1.5
                            bg-civic-600/90 text-white text-xs font-bold
                            px-2.5 py-1 rounded-full">
              ✓ Photo Captured
            </div>
          </div>
          <div className="p-3 flex items-center justify-between bg-ink-800/50">
            <div className="text-xs text-ink-400 space-y-0.5">
              <p>📅 {new Date(captured.timestamp).toLocaleString()}</p>
              {location && (
                <p>📍 {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</p>
              )}
            </div>
            <button onClick={retake} className="btn-ghost text-xs py-1 px-3">
              Retake
            </button>
          </div>
        </div>
      )}

      {/* ERROR */}
      {phase === 'error' && (
        <div className="p-6 text-center">
          <p className="text-red-400 text-sm mb-3">{error}</p>
          <button
            onClick={() => { setPhase('idle'); setError(null) }}
            className="btn-secondary text-xs"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}

const CamIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24"
       stroke="currentColor" strokeWidth="2">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)