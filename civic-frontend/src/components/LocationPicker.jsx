import { useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'

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
  // Outside Coimbatore district
  if (lat < 10.25 || lat > 11.35 || lng < 76.65 || lng > 77.45) {
    return { zone: 'UNASSIGNED', color: 'text-ink-400', bg: 'bg-ink-800 border-ink-700', areas: 'Outside Coimbatore District' }
  }
  if (lat > 11.05) return { zone: 'NORTH',   color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30',   areas: 'Mettupalayam, Annur, Karamadai, Thudiyalur' }
  if (lat < 10.85) return { zone: 'SOUTH',   color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/30',  areas: 'Pollachi, Valparai, Anaimalai, Kinathukadavu' }
  if (lng > 77.10) return { zone: 'EAST',    color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30', areas: 'Sulur, Palladam, Avinashi Road' }
  if (lng < 76.95) return { zone: 'WEST',    color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', areas: 'Madukkarai, Thondamuthur' }
  return               { zone: 'CENTRAL', color: 'text-civic-400',  bg: 'bg-civic-500/10 border-civic-500/30',  areas: 'Gandhipuram, RS Puram, Peelamedu, Singanallur' }
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

/**
 * LocationPicker
 * Props:
 *   value      — { latitude, longitude } or null
 *   onSelect   — called with { latitude, longitude }
 */
export default function LocationPicker({ value, onSelect }) {
  const defaultCenter  = [11.0168, 76.9558] // Coimbatore center
  const [query,         setQuery]        = useState('')
  const [results,       setResults]      = useState([])
  const [searching,     setSearching]    = useState(false)
  const [locating,      setLocating]     = useState(false)
  const [searchError,   setSearchError]  = useState(null)
  const [panTarget,     setPanTarget]    = useState(null)

  const markerPos = value?.latitude && value?.longitude
    ? [value.latitude, value.longitude]
    : null

  const zoneInfo = value?.latitude && value?.longitude
    ? detectZone(value.latitude, value.longitude)
    : null

  // ── Search by place name (Nominatim — free, no API key) ───────────────────
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
        setSearchError('No results found. Try a different name.')
      } else {
        setResults(data)
      }
    } catch {
      setSearchError('Search failed. Check your internet connection.')
    } finally {
      setSearching(false)
    }
  }, [query])

  // ── Pick from search results ──────────────────────────────────────────────
  const handlePickResult = (result) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    onSelect({ latitude: lat, longitude: lng })
    setPanTarget([lat, lng])
    setResults([])
    setQuery(result.display_name.split(',')[0])
  }

  // ── Use current GPS location ──────────────────────────────────────────────
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setSearchError('Geolocation not supported on this device.')
      return
    }
    setLocating(true)
    setSearchError(null)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const lat = coords.latitude
        const lng = coords.longitude
        onSelect({ latitude: lat, longitude: lng })
        setPanTarget([lat, lng])
        setLocating(false)
      },
      () => {
        setSearchError('Could not get your location. Please allow location access.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="rounded-xl overflow-hidden border border-ink-700">

      {/* ── Search Bar ── */}
      <div className="bg-ink-800 px-3 py-3 space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-500"
                 fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              className="input pl-8 py-2 text-sm"
              placeholder="Search area (e.g. Pollachi Bus Stand, Sulur...)"
              value={query}
              onChange={e => { setQuery(e.target.value); setResults([]) }}
            />
          </div>
          <button type="button" onClick={handleSearch} disabled={searching}
            className="btn-secondary text-xs px-3 py-2 flex-shrink-0">
            {searching
              ? <span className="w-4 h-4 border-2 border-ink-600 border-t-civic-500 rounded-full animate-spin" />
              : 'Search'}
          </button>
          <button type="button" onClick={handleCurrentLocation}
            disabled={locating}
            title="Use my current location"
            className="btn-primary text-xs px-3 py-2 flex-shrink-0 gap-1.5">
            {locating
              ? <span className="w-4 h-4 border-2 border-civic-300 border-t-white rounded-full animate-spin" />
              : <GpsIcon />}
            <span className="hidden sm:inline">My Location</span>
          </button>
        </div>

        {/* Search error */}
        {searchError && (
          <p className="text-red-400 text-xs px-1">{searchError}</p>
        )}

        {/* Search results dropdown */}
        {results.length > 0 && (
          <div className="bg-ink-900 border border-ink-700 rounded-lg overflow-hidden
                          max-h-44 overflow-y-auto shadow-xl">
            {results.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handlePickResult(r)}
                className="w-full text-left px-4 py-2.5 text-xs text-ink-200
                           hover:bg-ink-700 transition-colors border-b border-ink-800
                           last:border-0 flex items-start gap-2"
              >
                <svg className="w-3.5 h-3.5 text-civic-400 flex-shrink-0 mt-0.5"
                     fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span className="line-clamp-2">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Coordinates display */}
        {markerPos && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-ink-500">📍 Pin set:</span>
            <span className="font-mono text-civic-400">
              {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
            </span>
          </div>
        )}
      </div>

      {/* ── Map ── */}
      <MapContainer
        center={markerPos || defaultCenter}
        zoom={markerPos ? 14 : 11}
        style={{ height: '260px', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onSelect={(loc) => {
          onSelect(loc)
          setPanTarget([loc.latitude, loc.longitude])
        }} />
        {panTarget && <MapPanner position={panTarget} />}
        {markerPos && <Marker position={markerPos} />}
      </MapContainer>

      {/* ── Zone Detection Result ── */}
      {zoneInfo && (
        <div className={`px-4 py-3 border-t border-ink-700 text-xs ${zoneInfo.bg} border`}>
          <div className="flex items-center gap-2">
            <span className={`font-bold font-mono ${zoneInfo.color}`}>
              {zoneInfo.zone} ZONE
            </span>
            <span className="text-ink-400">→</span>
            <span className="text-ink-300">
              This issue will be auto-assigned to the <strong>{zoneInfo.zone} Zone Admin</strong>
            </span>
          </div>
          <p className="text-ink-500 mt-0.5">{zoneInfo.areas}</p>
        </div>
      )}

      {/* Instruction if no pin yet */}
      {!markerPos && (
        <div className="bg-ink-800/40 px-4 py-2 text-xs text-ink-500 border-t border-ink-700 text-center">
          Click on the map to drop a pin, search by area name, or use GPS
        </div>
      )}
    </div>
  )
}

const GpsIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
  </svg>
)
