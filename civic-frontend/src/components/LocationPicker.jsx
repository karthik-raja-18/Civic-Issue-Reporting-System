import { useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import Spinner from './Spinner'

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// ── Zone detector (mirrors backend logic) ─────────────────────────────────────
function detectZone(lat, lng) {
  if (!lat || !lng) return null
  if (lat < 10.25 || lat > 11.35 || lng < 76.65 || lng > 77.45) {
    return { zone: 'UNASSIGNED', color: 'text-light-muted', bg: 'bg-light-bg dark:bg-dark-bg', border: 'border-light-border dark:border-dark-border', areas: 'Outside Coimbatore District' }
  }
  if (lat > 11.05) return { zone: 'NORTH',   color: 'text-blue-500',   bg: 'bg-blue-500/5',   border: 'border-blue-500/20',   areas: 'Mettupalayam, Annur, Karamadai' }
  if (lat < 10.85) return { zone: 'SOUTH',   color: 'text-amber-500',   bg: 'bg-amber-500/5',   border: 'border-amber-500/20',   areas: 'Pollachi, Valparai, Anaimalai' }
  if (lng > 77.10) return { zone: 'EAST',    color: 'text-purple-500',    bg: 'bg-purple-500/5',    border: 'border-purple-500/20',    areas: 'Sulur, Palladam, Avinashi' }
  if (lng < 76.95) return { zone: 'WEST',    color: 'text-orange-500',    bg: 'bg-orange-500/5',    border: 'border-orange-500/20',    areas: 'Madukkarai, Thondamuthur' }
  return               { zone: 'CENTRAL', color: 'text-brand-blue', bg: 'bg-brand-blue/5', border: 'border-brand-blue/20', areas: 'Gandhipuram, RS Puram, Peelamedu' }
}

// ── Internal: map click handler ───────────────────────────────────────────────
function ClickHandler({ onSelect }) {
  useMapEvents({
    click(e) { onSelect({ latitude: e.latlng.lat, longitude: e.latlng.lng }) },
  })
  return null
}

// ── Internal: pan map to coords ───────────────────────────────────────────────
function MapPanner({ position }) {
  const map = useMap()
  if (position) map.setView(position, 14)
  return null
}

export default function LocationPicker({
  value,
  initialLocation,
  onSelect,
  onLocationSelect,
}) {
  const currentValue   = value || initialLocation || null
  const handleSelect   = onSelect || onLocationSelect

  const defaultCenter  = [11.0168, 76.9558] // Coimbatore center
  const [query,         setQuery]        = useState('')
  const [results,       setResults]      = useState([])
  const [searching,     setSearching]    = useState(false)
  const [locating,      setLocating]     = useState(false)
  const [searchError,   setSearchError]  = useState(null)
  const [panTarget,     setPanTarget]    = useState(null)

  const markerPos = currentValue?.latitude && currentValue?.longitude
    ? [currentValue.latitude, currentValue.longitude]
    : null

  const zoneInfo = currentValue?.latitude && currentValue?.longitude
    ? detectZone(currentValue.latitude, currentValue.longitude)
    : null

  const handleSearch = useCallback(async (e) => {
    e?.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setSearchError(null)
    setResults([])
    try {
      const url = `https://nominatim.openstreetmap.org/search` +
                  `?q=${encodeURIComponent(query + ', Coimbatore, Tamil Nadu')}` +
                  `&format=json&limit=5&countrycodes=in`
      const res  = await fetch(url, {
        headers: { 'Accept-Language': 'en', 'User-Agent': 'CivicPulse/1.0' }
      })
      const data = await res.json()
      if (data.length === 0) {
        setSearchError('Geographic record not found. Please refine search.')
      } else {
        setResults(data)
      }
    } catch {
      setSearchError('Network protocol error. External mapping service unreachable.')
    } finally {
      setSearching(false)
    }
  }, [query])

  const handlePickResult = (result) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    handleSelect({ latitude: lat, longitude: lng })
    setPanTarget([lat, lng])
    setResults([])
    setQuery(result.display_name.split(',')[0])
  }

  const isWithinDistrict = (lat, lng) =>
    lat >= 10.00 && lat <= 11.60 && lng >= 76.40 && lng <= 77.70

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
       setSearchError('Geolocation is not supported by this browser.')
      return
    }
    setLocating(true)
    setSearchError(null)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const lat = coords.latitude
        const lng = coords.longitude
        if (!isWithinDistrict(lat, lng)) {
           setSearchError(`The detected location is outside the Coimbatore District.`)
          setLocating(false)
          return
        }
        handleSelect({ latitude: lat, longitude: lng })
        setPanTarget([lat, lng])
        setLocating(false)
      },
      () => {
         setSearchError('Geolocation permission denied.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const { latitude, longitude } = currentValue || {}

  return (
    <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-[2.5rem] overflow-hidden shadow-sm">
       {/* Location Search */}
      <div className="p-6 lg:p-8 bg-light-bg/50 dark:bg-dark-bg/50 border-b border-light-border dark:border-dark-border">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
             <div className="absolute left-5 top-1/2 -translate-y-1/2 text-light-muted">
                <SearchIcon />
             </div>
             <input
              type="text"
              className="w-full h-14 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-2xl pl-12 pr-6 text-[14px] font-bold outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all placeholder:font-medium placeholder:opacity-30"
               placeholder="Search for a location..."
              value={query}
              onChange={e => { setQuery(e.target.value); setResults([]) }}
            />
          </div>
          <div className="flex gap-2.5">
            <button type="submit" disabled={searching}             className="h-14 px-8 btn btn-primary flex items-center justify-center gap-2.5 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-brand-blue/20"
             title="Search"
           >
              {searching ? <Spinner size="sm" /> : <SearchIcon />}
              <span>Search</span>
            </button>
            <button type="button"             onClick={handleCurrentLocation}
             className="h-14 px-5 btn btn-secondary border-light-border dark:border-dark-border flex items-center justify-center gap-2.5 text-[11px] font-black uppercase tracking-widest hover:bg-black/5"
             title="My Location"
             disabled={locating}
           >
              {locating ? <Spinner size="sm" /> : <GpsIcon />}
              <span className="hidden lg:inline">My Location</span>
            </button>
          </div>
        </form>

        {searchError && (
          <div className="mt-4 px-6 py-3 bg-gov-danger/5 border border-gov-danger/20 rounded-xl text-[11px] font-black text-gov-danger uppercase tracking-widest leading-loose">
            <span className="mr-2">⚠ SYSTEM ALERT:</span> {searchError}
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-4 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-2xl overflow-hidden shadow-2xl relative z-[1000] animate-slide-down">
            {results.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handlePickResult(r)}
                className="w-full text-left px-6 py-4 text-[13px] font-bold text-light-primary dark:text-dark-primary hover:bg-brand-blue/5 border-b border-light-border dark:border-dark-border last:border-0 flex items-start gap-4 transition-colors"
              >
                <div className="text-brand-blue mt-0.5"><MapPinIcon /></div>
                <span className="line-clamp-1 opacity-80">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Engine Interface */}
      <div className="relative group">
        <MapContainer
          center={markerPos || defaultCenter}
          zoom={markerPos ? 14 : 11}
          style={{ height: '350px', width: '100%', zIndex: 1 }}
          scrollWheelZoom={false}
          className="grayscale-[0.1] hover:grayscale-0 transition-all duration-700 dark:invert-[0.9] dark:hue-rotate-180"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onSelect={(loc) => {
            handleSelect(loc)
            setPanTarget([loc.latitude, loc.longitude])
          }} />
          {panTarget && <MapPanner position={panTarget} />}
          {markerPos && <Marker position={markerPos} />}
        </MapContainer>

        {markerPos && (
          <div className="p-8 lg:p-10 border-t border-light-border dark:border-dark-border">
             <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex-1 space-y-3">
                   <h3 className="text-[11px] font-black text-light-primary dark:text-dark-primary uppercase tracking-[0.2em]">Selected Location</h3>
                   <div className="space-y-4">
                      <div>
                         <p className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-widest mb-1.5 opacity-60">Location Status</p>
                         <div className="flex items-center gap-3 text-gov-success font-black text-[13px] tracking-tight">
                            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                            Location Verified
                         </div>
                      </div>
                      
                      <div className="flex gap-8">
                         <div>
                            <p className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-widest mb-1 opacity-60">Coordinates</p>
                            <p className="text-[14px] font-mono font-bold text-light-primary dark:text-dark-primary">{latitude.toFixed(6)}, {longitude.toFixed(6)}</p>
                         </div>
                         <div>
                            <p className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-widest mb-1 opacity-60">Area / Zone</p>
                            <p className={`text-[13px] font-black uppercase tracking-widest ${zoneInfo?.color || ''}`}>
                               {zoneInfo?.zone || 'Unassigned'}
                            </p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="h-20 w-px bg-light-border dark:border-dark-border mx-2 hidden lg:block" />

                <div className="flex-1">
                   <p className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-widest mb-2 opacity-60">Assigned Zone Details</p>
                   <div className="p-4 bg-light-bg/50 dark:bg-dark-bg/50 rounded-2xl border border-light-border dark:border-dark-border">
                      <p className="text-[13px] font-bold text-light-primary dark:text-dark-primary leading-snug">
                         {zoneInfo?.areas || 'Determining regional jurisdiction...'}
                      </p>
                   </div>
                </div>
             </div>
          </div>
        )}

        {!markerPos && (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-6">
             <div className="w-16 h-16 rounded-3xl bg-light-bg dark:bg-dark-bg/50 border-2 border-dashed border-light-border dark:border-dark-border flex items-center justify-center opacity-40">
                <svg className="w-8 h-8 text-light-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
             </div>
             <div className="space-y-1">
                <h4 className="text-lg font-black text-light-primary dark:text-dark-primary tracking-tight">Location Not Selected</h4>
                <p className="text-[12px] font-bold text-light-muted uppercase tracking-widest opacity-60">Click on the map or use search to select the issue location.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  )
}


function SearchIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  )
}

function MapPinIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  )
}

function GpsIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V3m9 9H3" />
    </svg>
  )
}