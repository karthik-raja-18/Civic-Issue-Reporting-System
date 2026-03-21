import { useState, useRef, useEffect, useCallback } from 'react'
import { issueApi } from '../api/issueApi'

export default function EvidenceCapture({
  onUpload,
  onLocationCapture,
  latitude: propLat,
  longitude: propLng,
}) {
  const videoRef   = useRef(null)
  const canvasRef  = useRef(null)
  const streamRef  = useRef(null)

  const [phase,     setPhase]     = useState('idle')
  const [location,  setLocation]  = useState(
    propLat && propLng ? { latitude: propLat, longitude: propLng } : null
  )
  const [captured,  setCaptured]  = useState(null)
  const [uploadedUrl, setUploadedUrl] = useState('')
  const [error,     setError]     = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  const startCamera = useCallback(async () => {
    setPhase('camera')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width:  { ideal: 1280 },
          height: { ideal: 720  },
        },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch {
      setError('Camera access denied. Please allow camera access in your browser settings.')
      setPhase('error')
    }
  }, [])

  const requestLocation = useCallback(() => {
    setPhase('locating')
    setError(null)

    if (propLat && propLng) {
      const loc = { latitude: propLat, longitude: propLng, accuracy: 0 }
      setLocation(loc)
      onLocationCapture?.(loc)
      startCamera()
      return
    }

    if (!navigator.geolocation) {
      startCamera()
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const lat = coords.latitude
        const lng = coords.longitude
        const withinDistrict = lat >= 10.00 && lat <= 11.60 &&
                                lng >= 76.40 && lng <= 77.70
        if (withinDistrict) {
          const loc = { latitude: lat, longitude: lng, accuracy: Math.round(coords.accuracy) }
          setLocation(loc)
          onLocationCapture?.(loc)
        }
        startCamera()
      },
      () => {
        setLocation(null)
        startCamera()
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [propLat, propLng, onLocationCapture, startCamera])

  const drawWatermark = (ctx, w, h, now) => {
    const loc = location || (propLat && propLng
      ? { latitude: propLat, longitude: propLng }
      : null)

    const dateStr = now.toLocaleString('en-IN', {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    })
    const locStr = loc
      ? `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`
      : 'GPS unavailable'

    const lines    = ['CivicPulse — Live Evidence', `Date: ${dateStr}`, `GPS:  ${locStr}`]
    const barH     = 90
    const fontSize = Math.max(13, Math.round(w / 85))

    ctx.fillStyle = 'rgba(0,0,0,0.72)'
    ctx.fillRect(0, h - barH, w, barH)
    ctx.fillStyle = '#22c55e'
    ctx.fillRect(0, h - barH, 5, barH)
    ctx.font      = `bold ${fontSize}px monospace`
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'left'
    lines.forEach((line, i) => {
      ctx.fillText(line, 14, h - barH + 24 + i * (fontSize + 6))
    })
    ctx.fillStyle = 'rgba(220,38,38,0.90)'
    ctx.fillRect(w - 140, 10, 130, 30)
    ctx.fillStyle = '#fff'
    ctx.font      = `bold 12px monospace`
    ctx.textAlign = 'right'
    ctx.fillText('● LIVE EVIDENCE', w - 14, 30)
  }

  const capturePhoto = useCallback(() => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const now       = new Date()
    const MAX_WIDTH = 800
    const scale     = Math.min(1, MAX_WIDTH / (video.videoWidth || 1280))
    canvas.width    = (video.videoWidth  || 1280) * scale
    canvas.height   = (video.videoHeight || 720)  * scale

    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    drawWatermark(ctx, canvas.width, canvas.height, now)

    canvas.toBlob((blob) => {
      const file       = new File([blob], `evidence_${Date.now()}.jpg`, { type: 'image/jpeg' })
      const previewUrl = URL.createObjectURL(blob)
      const timestamp  = now.toISOString()
      setCaptured({ file, previewUrl, timestamp })
      stopCamera()
      setPhase('captured')
    }, 'image/jpeg', 0.6)
  }, [location, propLat, propLng, stopCamera])

  const uploadToCloudinary = useCallback(async (file) => {
      setPhase('uploading')
      setUploadProgress(0)
      setError(null)
      try {
        const loc = location || (propLat && propLng
          ? { latitude: propLat, longitude: propLng }
          : null)

        setUploadProgress(30)
        const url = await issueApi.uploadImageDirect(
          file,
          loc?.latitude,
          loc?.longitude
        )
        setUploadProgress(100)
        setUploadedUrl(url)
        setPhase('done')
        onUpload?.(url)

      } catch (err) {
        setError(err.message || 'Upload failed. Please try again.')
        setPhase('captured')
      }
    }, [location, propLat, propLng, onUpload])

  const retake = () => {
    setCaptured(null)
    setUploadedUrl('')
    setPhase('idle')
    setError(null)
    onUpload?.('')
  }

  return (
    <div className="card shadow-md overflow-hidden bg-light-surface dark:bg-dark-surface">
      
      {/* Viewport Area */}
      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
        
        {/* IDLE / START UP */}
        {phase === 'idle' && (
          <div className="flex flex-col items-center gap-4 p-8 text-center animate-fade">
             <div className="w-16 h-16 rounded-full bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center text-brand-blue">
                <CamIcon className="w-8 h-8" />
             </div>
             <div className="space-y-1">
                <h3 className="text-white text-lg font-display">Capture Evidence</h3>
                <p className="text-white/60 text-sm max-w-xs mx-auto">
                  Take a live photo of the issue. Location and timestamp will be auto-embedded.
                </p>
             </div>
             <button onClick={requestLocation} className="btn btn-primary btn-lg mt-2">
                <CamIcon className="w-5 h-5 mr-2" /> Start Camera
             </button>
          </div>
        )}

        {/* LOCATING */}
        {phase === 'locating' && (
          <div className="flex flex-col items-center gap-4 animate-pulse">
             <div className="w-12 h-12 border-4 border-brand-saffron/30 border-t-brand-saffron rounded-full animate-spin" />
             <p className="text-white/80 font-mono text-sm uppercase tracking-widest">Pinpointing GPS...</p>
          </div>
        )}

        {/* ACTIVE CAMERA */}
        {phase === 'camera' && (
          <>
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-gov-danger px-2.5 py-1 rounded text-white text-[11px] font-bold uppercase tracking-wider">
               <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Live Viewfinder
            </div>
            {location && (
               <div className="absolute bottom-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded border border-white/20 text-white font-mono text-[11px]">
                  📍 {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
               </div>
            )}
            <div className="absolute bottom-6 inset-x-0 z-20 flex justify-center">
               <button 
                  onClick={capturePhoto}
                  className="w-16 h-16 rounded-full border-[3px] border-white p-1 hover:scale-105 active:scale-95 transition-transform"
               >
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center" />
               </button>
            </div>
          </>
        )}

        {/* CAPTURED PREVIEW */}
        {(phase === 'captured' || phase === 'uploading' || phase === 'done') && captured && (
          <>
            <img src={captured.previewUrl} alt="Preview" className="w-full h-full object-cover" />
            
            {phase === 'captured' && (
              <div className="absolute top-4 left-4 z-10 bg-gov-warning px-2.5 py-1 rounded text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
                 📸 Preview Mode
              </div>
            )}

            {phase === 'uploading' && (
              <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                 <div className="w-full max-w-[200px] h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-saffron transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                 </div>
                 <p className="text-white font-mono text-xs uppercase tracking-widest">Uploading to secure server ({uploadProgress}%)</p>
              </div>
            )}

            {phase === 'done' && (
              <div className="absolute top-4 left-4 z-10 bg-gov-success px-2.5 py-1 rounded text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
                 ✓ Evidence Secured
              </div>
            )}
          </>
        )}

        {/* ERROR STATE */}
        {phase === 'error' && (
           <div className="flex flex-col items-center gap-4 p-8 text-center animate-fade">
              <div className="w-16 h-16 rounded-full bg-gov-danger/10 flex items-center justify-center text-gov-danger">
                 <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
              </div>
              <p className="text-white text-sm max-w-xs">{error}</p>
              <button onClick={() => setPhase('idle')} className="btn btn-secondary text-white border-white/30 hover:bg-white/10">Try Again</button>
           </div>
        )}
      </div>

      {/* Controls / Information Bar */}
      {(phase === 'captured' || phase === 'done') && (
        <div className="p-4 bg-light-surface dark:bg-dark-surface border-t border-light-border dark:border-dark-border flex items-center justify-between">
           <div className="flex flex-col">
              <span className="text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider">Evidence Information</span>
              <span className="text-[13px] font-medium text-light-primary dark:text-dark-primary mt-0.5">
                 {new Date(captured.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • Secure Watermark Applied
              </span>
           </div>
           
           <div className="flex gap-2">
              <button onClick={retake} className="btn btn-secondary btn-sm">Retake</button>
              {phase === 'captured' && (
                <button 
                  onClick={() => uploadToCloudinary(captured.file)}
                  className="btn btn-primary btn-sm"
                >
                  Confirm & Upload
                </button>
              )}
           </div>
        </div>
      )}

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

const CamIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
  </svg>
)