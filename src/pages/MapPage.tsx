// Human-readable label maps
const ROLE_LABELS: Record<string, string> = {
  'youth-program-operator': 'Youth Program Operator',
  'ngo-nonprofit': 'NGO / Nonprofit',
  'school-university': 'School / University',
  'startup-builder': 'Startup / Builder',
  'government-policy': 'Government / Policy',
  'funder-donor': 'Funder / Donor',
  'other': 'Other',
};

const FOCUS_LABELS: Record<string, string> = {
  'entrepreneurship': 'Entrepreneurship',
  'education': 'Education',
  'employment': 'Employment',
  'peacebuilding-civic-engagement': 'Peacebuilding / Civic Engagement',
  'technology-innovation': 'Technology / Innovation',
  'other': 'Other',
};

const CONSTRAINT_LABELS: Record<string, string> = {
  'funding': 'Funding',
  'execution-capacity': 'Execution Capacity',
  'engagement': 'Engagement',
  'institutional-support': 'Institutional Support',
  'training-skills': 'Training / Skills',
  'other': 'Other',
};
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { Link, useLocation, useNavigate } from 'react-router'
import Globe from 'react-globe.gl'
import type { GlobeMethods } from 'react-globe.gl'
import gsap from 'gsap'
import { getEntryMetrics, FOCUS_COLOR } from '../lib/map/clusterEntries'
import { getCountryByCode, getStateByCode } from '../lib/map/countryCentroids'
import { useEntries } from '../lib/supabase/useEntries'

const GEOJSON_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson'

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

function compactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

function MapPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { entries, isLoading, error, reload } = useEntries()
  const [countriesGeo, setCountriesGeo] = useState({ features: [] })
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null)
  const [globeSize, setGlobeSize] = useState({ width: 0, height: 0 })
  const [isLeaving, setIsLeaving] = useState(false)
  const pageRef = useRef<HTMLElement>(null)
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
  const headerRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLElement>(null)
  const metricsRef = useRef<HTMLDivElement>(null)
  const globeContainerRef = useRef<HTMLDivElement>(null)
  const logosRef = useRef<HTMLDivElement>(null)
  const desktopMetricsRef = useRef<HTMLDivElement>(null)
  const mobileUIRef = useRef<HTMLDivElement>(null)

  // Each entry gets a lat/lng at the country/state centroid
  // Add a small random offset to each entry's lat/lng to avoid perfect overlap
  // Type for entries with lat/lng
  type EntryWithCoords = typeof entries[number] & { lat: number; lng: number; countryName: string; stateName?: string; color: string };
  const entryPoints = useMemo<EntryWithCoords[]>(() => {
    // Group entries by country + state for spiral spreading
    const grouped: Record<string, EntryWithCoords[]> = {};
    for (const entry of entries) {
      const key = `${entry.country}-${entry.state || 'none'}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(entry as EntryWithCoords);
    }
    const points: EntryWithCoords[] = [];
    const pointVisualRadius = 0.45 * 2.5;

    for (const key in grouped) {
      const cluster = grouped[key];
      const first = cluster[0];
      const countryCode = first.country;
      const stateCode = first.state;

      const country = getCountryByCode(countryCode);
      if (!country) {
        // console.warn(`Country not found: ${countryCode}`);
        continue;
      }

      let lat = Number.parseFloat(country.latitude);
      let lng = Number.parseFloat(country.longitude);
      let stateName: string | undefined;

      if (stateCode) {
        const state = getStateByCode(country.isoCode, stateCode);
        if (state && state.latitude && state.longitude) {
          lat = Number.parseFloat(state.latitude);
          lng = Number.parseFloat(state.longitude);
          stateName = state.name;
        } else if (state) {
          // console.warn(`State found but no coords for: ${state.name}`);
        } else {
          // console.warn(`State not found: ${stateCode} in ${country.name}`);
        }
      }

      const n = cluster.length;
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const minSpiralRadius = Math.max(pointVisualRadius * 1.1, 0.18);
      const maxSpiralRadius = 0.45 + Math.log2(n + 1) * 0.18;

      for (let i = 0; i < n; i++) {
        const entry = cluster[i];
        const angle = i * goldenAngle;
        const radius = minSpiralRadius + (maxSpiralRadius - minSpiralRadius) * Math.sqrt(i / Math.max(1, n - 1));
        const dLat = Math.cos(angle) * radius;
        const dLng = Math.sin(angle) * radius;
        points.push({ 
          ...entry, 
          lat: lat + dLat, 
          lng: lng + dLng, 
          countryName: country.name,
          stateName,
          color: FOCUS_COLOR[entry.focusArea]
        });
      }
    }
    return points;
  }, [entries]);

  // For country selection, build a quick lookup
  const countryMeta = useMemo(() => {
    const map = new Map<string, { count: number; totalReach: number; entries: typeof entryPoints }>()
    for (const entry of entryPoints) {
      if (!entry) continue

      let key = entry.countryName;

      // shhhhh
      if (key === "United States") {
        key = "United States of America";
      }

      const arr = map.get(key)
      
      if (arr) {
        arr.count++
        arr.totalReach += entry.estimatedReach
        arr.entries.push(entry)
      } else {
        map.set(key, { count: 1, totalReach: entry.estimatedReach, entries: [entry] })
      }
    }
    return map
  }, [entryPoints])

  const metrics = useMemo(() => getEntryMetrics(entries), [entries])

  // Selection: either an entry (by id) or a country (by name)
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null)
  const [globeAltitude, setGlobeAltitude] = useState(2.0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const aboutPopupRef = useRef<HTMLDivElement>(null)
  const aboutOverlayRef = useRef<HTMLDivElement>(null)

  // Function to handle selection updates
  const handleSelectCountry = (name: string | null) => {
    setSelectedCountry(name)
    setSelectedEntryId(null)
    setExpandedCountry(null)
  }

  const handleSelectEntry = (id: string | null, countryName: string | null) => {
    setSelectedEntryId(id)
    setSelectedCountry(countryName)
    setExpandedCountry(null)
  }

  const closeMobileBottomBar = () => {
    setSelectedEntryId(null)
    setSelectedCountry(null)
  }

  const animateBackToHome = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()

    if (isLeaving) {
      return
    }

    setIsLeaving(true)

    const timeline = gsap.timeline({
      onComplete: () => {
        navigate('/input', { state: { fromMap: true } })
      },
    })

    timeline
      .to([sidebarRef.current, metricsRef.current], {
        x: -18,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.inOut',
        stagger: 0.06,
      })
      .to(
        headerRef.current,
        {
          y: -24,
          opacity: 0,
          duration: 0.28,
          ease: 'power2.inOut',
        },
        '<',
      )
      .to(
        globeContainerRef.current,
        {
          scale: 0.94,
          opacity: 0,
          duration: 0.38,
          ease: 'power2.inOut',
        },
        '-=0.1',
      )
  }

  useLayoutEffect(() => {
    const timeline = gsap.timeline()

    timeline
      .fromTo(
        headerRef.current,
        { y: -70, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
      )
      .fromTo(
        [sidebarRef.current, metricsRef.current, logosRef.current],
        { x: -24, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' },
        '-=0.25',
      )
      .fromTo(
        desktopMetricsRef.current,
        { x: 24, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
        '<',
      )
      .fromTo(
        globeContainerRef.current,
        { scale: 0.92, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.7, ease: 'power2.out' },
        '-=0.25',
      )

    if ((location.state as { fromHome?: boolean } | null)?.fromHome) {
      timeline.timeScale(1.08)
    }

    return () => {
      timeline.kill()
    }
  }, [location.state])

  // Fullscreen animation logic
  useLayoutEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

    if (isFullscreen) {
      // Animate OUT
      gsap.to(sidebarRef.current, { x: -300, opacity: 0, scale: 0.8, duration: 0.6, ease: 'power2.inOut' })
      gsap.to(logosRef.current, { x: -200, opacity: 0, scale: 0.8, duration: 0.6, ease: 'power2.inOut' })
      gsap.to(desktopMetricsRef.current, { x: 300, opacity: 0, scale: 0.8, duration: 0.6, ease: 'power2.inOut' })
      gsap.to(metricsRef.current, { y: 200, opacity: 0, scale: 0.8, duration: 0.6, ease: 'power2.inOut' })
    } else {
      // Animate IN (return to original state)
      gsap.to(sidebarRef.current, { x: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' })
      gsap.to(logosRef.current, { x: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' })
      gsap.to(desktopMetricsRef.current, { x: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' })
      gsap.to(metricsRef.current, { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' })
    }
  }, [isFullscreen])

  useEffect(() => {
    const globe = globeRef.current
    if (!globe) {
      return
    }

    globe.pointOfView({ lat: 14, lng: 12, altitude: 1.9 }, 0)
    setTimeout(() => setGlobeAltitude(1.9), 0)
  }, [globeSize.height, globeSize.width])

  useEffect(() => {
    const element = pageRef.current
    if (!element) {
      return
    }

    const updateSize = () => {
      const rect = element.getBoundingClientRect()
      setGlobeSize({
        width: Math.max(0, Math.floor(rect.width)),
        height: Math.max(0, Math.floor(rect.height)),
      })
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    fetch(GEOJSON_URL)
      .then(res => res.json())
      .then(setCountriesGeo)
  }, [])

  // About Popup initial load and animation logic
  useEffect(() => {
    const hasSeenAbout = localStorage.getItem('hasSeenAbout')
    if (!hasSeenAbout) {
      setTimeout(() => setShowAbout(true), 1000)
      localStorage.setItem('hasSeenAbout', 'true')
    }
  }, [])

  useLayoutEffect(() => {
    if (showAbout) {
      gsap.fromTo(aboutOverlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.4 }
      )
      gsap.fromTo(aboutPopupRef.current,
        { y: '100dvh', opacity: 0 },
        { y: '0', opacity: 1, duration: 0.7, ease: 'expo.out' }
      )
    }
  }, [showAbout])

  const closeAbout = () => {
    if (aboutPopupRef.current && aboutOverlayRef.current) {
      const tl = gsap.timeline({
        onComplete: () => setShowAbout(false)
      })

      tl.to(aboutPopupRef.current, {
        y: '100dvh',
        opacity: 0,
        duration: 0.6,
        ease: 'expo.in'
      })
      .to(aboutOverlayRef.current, {
        opacity: 0,
        duration: 0.3
      }, '-=0.3')
    } else {
      setShowAbout(false)
    }
  }

  return (
    <main ref={pageRef} className="relative h-dvh overflow-hidden bg-[#3a0000] text-white">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(128,0,32,0.28),transparent_45%),radial-gradient(circle_at_80%_75%,rgba(90,0,25,0.22),transparent_40%),linear-gradient(180deg,rgba(8,13,24,0.82),rgba(8,13,24,0.92))]" />
      </div>

      <div ref={globeContainerRef} className="absolute inset-0 z-[5]">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-[#b8c5df]">Loading map data...</div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
            <p className="text-[#ffd5d5]">{error}</p>
            <button
              onClick={() => void reload()}
              className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Globe
              ref={globeRef}
              width={globeSize.width}
              height={globeSize.height}
              backgroundColor="rgba(0,0,0,0)"
              globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
              bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
              
              polygonsData={countriesGeo.features}
              polygonSideColor={() => 'rgba(255, 255, 255, 0.05)'}
              polygonStrokeColor={() => '#111'}
              polygonCapColor={(d: object) => {
                const properties = (d as { properties: Record<string, string> }).properties;
                const name = properties.NAME || properties.ADMIN
                if (selectedCountry === name) return 'rgba(177, 66, 66, 0.4)'
                if (hoveredCountry === name) return 'rgba(177, 66, 66, 0.2)'
                return 'transparent'
              }}
              onPolygonHover={(d: object | null) => {
                const properties = (d as { properties: Record<string, string> } | null)?.properties;
                const name = properties?.NAME || properties?.ADMIN || null
                setHoveredCountry(name)
              }}
              onPolygonClick={(d: object) => {
                const properties = (d as { properties: Record<string, string> }).properties;
                const name = properties.NAME || properties.ADMIN
                handleSelectCountry(name)
              }}
              polygonLabel={(d: object) => {
                const properties = (d as { properties: Record<string, string> }).properties;
                return properties.NAME || properties.ADMIN;
              }}

              pointsData={entryPoints}
              pointLat="lat"
              pointLng="lng"
              pointColor="color"
              pointRadius={0.45}
              pointAltitude={0.04}
              pointLabel={(point) => {
                const entry = point as typeof entryPoints[number]
                return `${entry.organizationName || 'Untitled Organization'}\n${entry.stateName ? `${entry.stateName}, ` : ''}${entry.countryName}`
              }}
              onPointClick={(point) => {
                const entry = point as typeof entryPoints[number]
                handleSelectEntry(entry.id, entry.countryName)
              }}
              onZoom={(pov) => {
                setGlobeAltitude(pov.altitude)
              }}
            />
          </div>
        )}
      </div>

      <div className='hidden sm:block'>
        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="absolute left-6 top-6 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,255,255,0.08)] text-white backdrop-blur-[18px] transition-all hover:bg-white/20 active:scale-95"
          title={isFullscreen ? "Show UI" : "Fullscreen Mode"}
        >
          <Icon icon={isFullscreen ? "mdi:fullscreen-exit" : "mdi:fullscreen"} className="h-6 w-6" />
        </button>

        <button
          type="button"
          onClick={() => setShowAbout(true)}
          className="absolute right-6 top-6 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,255,255,0.08)] text-white backdrop-blur-[18px] transition-all hover:bg-white/20 active:scale-95"
          title="About ECOSOC"
        >
          <Icon icon="mdi:help-circle-outline" className="h-6 w-6" />
        </button>
      </div>

      {showAbout && (
        <div 
          ref={aboutOverlayRef}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
        >
          <div 
            ref={aboutPopupRef}
            className="relative w-full max-w-md rounded-[20px] bg-[#300c13] p-8 shadow-2xl overflow-hidden"
          >            
            <button 
              onClick={closeAbout}
              className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors"
            >
              <Icon icon="mdi:close" className="h-6 w-6" />
            </button>

            <h2 className="text-2xl font-bold mb-4 text-white">Good to see you again!</h2>
            
            <div className="space-y-4 text-[#e0ced1] text-sm leading-relaxed">
              <p>
                It was amazing connecting at the ECOSOC Youth Forum. This map reflects live inputs from participants, showcasing youth innovation ecosystems, funding sources, and other related organizations across countries. It highlights active initiatives as well as key challenges being faced, offering a simple way to understand how these efforts connect across regions.
              </p>
              
              <div className="pt-4 border-t border-white/10">
                <p className="text-[#e0ced1] font-light">Let's stay in touch!</p>
                <p className="text-[#e0ced1] font-semibold mt-2">Ethan Yip</p>
                <p className="text-xs font-medium text-[#b3969a]">Founder  -  HTSI</p>
              </div>
            </div>

            <button
              onClick={closeAbout}
              className="mt-8 w-full py-3 rounded-2xl bg-[#B14242] hover:bg-[#8e3535] text-white font-bold transition-all shadow-lg active:scale-[0.98]"
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      <div ref={headerRef} className="absolute left-1/2 top-5 z-20 w-[min(488px,calc(100%-1.5rem))] -translate-x-1/2 rounded-[25px] bg-[rgba(255,255,255,0.08)] p-[12px] backdrop-blur-[18px] md:top-8 md:w-[min(488px,calc(100%-2rem))] md:p-[15px]">
        <div className="relative mb-[5px] flex min-h-10 items-center justify-center md:min-h-0">
          <h1 className="text-center rounded-[10px] px-5 py-2 text-lg font-bold text-white md:text-[20px]">ECOSOC Youth Innovation Systems Map</h1>
        </div>

        <div className="grid grid-cols-2 rounded-[35px] bg-[rgba(255,255,255,0.1)] p-[2px]">
          <div className="flex h-9 items-center justify-center gap-2 rounded-[20px] bg-[rgba(255,255,255,0.1)] text-sm font-bold text-white">
            <Icon icon="mdi-light:map-marker" className="h-[22px] w-[22px]" />
            <span>Map</span>
          </div>
          <Link
            to="/input"
            onClick={animateBackToHome}
            className="flex h-9 items-center justify-center gap-2 rounded-[20px] text-sm font-medium text-[#cfcfcf] transition hover:text-[#e6e6e6]"
          >
            <Icon icon="mdi:list-box-outline" className="h-[22px] w-[22px]" />
            <span>Input View</span>
          </Link>
        </div>
      </div>

      <section 
        className={`pointer-events-none relative z-10 h-full px-4 pb-4 pt-36 md:px-6 md:pb-6 md:pt-40 flex flex-col justify-between`}
      >
        {/* Logos bottom left */}
        <div 
          ref={logosRef}
          className="absolute origin-bottom-left scale-[1.3] bottom-6 left-6 z-20 flex items-center transition-opacity duration-500 pointer-events-none hidden md:flex"
          style={{ opacity: Math.max(0, Math.min(1, (globeAltitude - 1.2) * 2)) }}
        >
          <img src="/htsi_logo.png" alt="HTSI Logo" className="h-20 w-20 object-contain opacity-80" />
          <img src="/ecosoc_logo.png" alt="ECOSOC Logo" className="h-24 object-contain opacity-80" />
        </div>

        <aside ref={sidebarRef} className="z-1000 pointer-events-auto w-[320px] max-h-full overflow-hidden m-3 rounded-[20px] bg-[rgba(255,255,255,0.08)] p-5 backdrop-blur-[30px] hidden md:flex md:flex-col">
          <div className="flex flex-col h-full overflow-hidden">
            <h2 className="mb-3 text-base font-semibold text-white">Details</h2>
            
            <div className="flex-1 overflow-hidden flex flex-col">
              {!selectedEntryId && !selectedCountry && !hoveredCountry ? (
                <p className="text-sm text-[#e0ced1]">Click a point to view entry details or hover to see country summary.</p>
              ) : selectedEntryId ? (
                (() => {
                  const entry = entryPoints.find(e => e.id === selectedEntryId)
                  if (!entry) return <p className="text-sm text-[#e0ced1]">Entry not found.</p>
                  return (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <article className="rounded-lg bg-white/5 p-3 flex flex-col gap-1 overflow-y-auto">
                        <p className="text-sm font-bold text-white whitespace-pre-line">{entry.organizationName || 'Untitled Organization'}</p>
                        {entry.organizationDescription && (
                          <p className="text-xs text-[#e0e0e0] italic mb-1 whitespace-pre-line">{entry.organizationDescription}</p>
                        )}
                        <ul className="mt-1 mb-1 space-y-1 text-xs text-[#e0ced1]">
                          <li><span className="font-semibold text-[#B14242]">{CONSTRAINT_LABELS[entry.primaryConstraint] || entry.primaryConstraint}</span></li>
                          <li>{ROLE_LABELS[entry.roleType] || entry.roleType}</li>
                          <li>{FOCUS_LABELS[entry.focusArea] || entry.focusArea}</li>
                          {entry.estimatedReach > 0 && <li><span className="text-[#b8e986]">Reach: {formatNumber(entry.estimatedReach)}</span></li>}
                        </ul>
                        {entry.contact && (
                          <div className="pt-1 mt-1 border-t border-white/10">
                            <span className="text-xs text-[#d9e7ff] break-all">{entry.contact}</span>
                          </div>
                        )}
                      </article>
                    </div>
                  )
                })()
              ) : (
                (() => {
                  const country = selectedCountry || hoveredCountry
                  const meta = countryMeta.get(country!)
                  if (!meta) return <p className="text-sm text-[#e0ced1]">No entries in this country.</p>
                  return (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="space-y-3 shrink-0">
                        <div className="rounded-lg bg-white/5 p-3">
                          <p className="text-xs text-[#e0ced1]">Country {hoveredCountry && !selectedCountry && '(Hovered)'}</p>
                          <p className="text-base font-semibold text-white">{country}</p>
                        </div>
                        <div className="rounded-lg bg-white/5 p-3">
                          <p className="text-xs text-[#e0ced1]">Entries</p>
                          <p className="text-base font-semibold text-white">{formatNumber(meta.count)}</p>
                        </div>
                        <div className="rounded-lg bg-white/5 p-3">
                          <p className="text-xs text-[#e0ced1]">Estimated Reach</p>
                          <p className="text-base font-semibold text-white">{formatNumber(meta.totalReach)}</p>
                        </div>
                      </div>
                      
                      <div className="my-4 border-t border-white/10 shrink-0" />
                      
                      <div className="flex-1 overflow-hidden relative flex flex-col">
                        <div 
                          className={`grid grid-cols-2 gap-2 pr-1 items-start ${
                            !expandedCountry 
                              ? meta.entries.length > 4 
                                ? 'max-h-[140px] overflow-hidden'
                                : '' 
                              : 'overflow-y-auto flex-1'
                          }`}

                          style={
                            !expandedCountry && meta.entries.length > 4
                              ? { 
                                  maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
                                  WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
                                }
                              : undefined
                          }
                        >
                          {(expandedCountry ? meta.entries : meta.entries.slice(0, 6)).map((entry, idx) => (
                            entry && (
                              <article 
                                key={entry.id} 
                                className={`rounded-lg bg-white/10 p-2 flex flex-col gap-1 h-full min-h-[64px] transition-all duration-300 ${!expandedCountry && idx >= 4 ? 'blur-[1px]' : ''}`}
                              >
                                <span className="text-[11px] text-white font-semibold line-clamp-2 leading-tight">{entry.organizationName || 'Untitled Organization'}</span>
                                <span className="text-[10px] text-[#e0ced1] mt-auto">{ROLE_LABELS[entry.roleType] || entry.roleType}</span>
                              </article>
                            )
                          ))}
                        </div>
                        
                        {!expandedCountry && meta.entries.length > 4 && (
                          <div className="absolute inset-x-0 bottom-0 flex justify-center pb-2 pt-12 pointer-events-none">
                            <button
                              onClick={() => setExpandedCountry(country)}
                              className="pointer-events-auto px-5 py-2 rounded-full bg-[#800000] hover:bg-[#a00000] text-white text-[11px] font-bold shadow-xl transition-all hover:scale-105 active:scale-95"
                            >
                              See More
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 space-y-2 shrink-0">
              <p className="text-[10px] font-bold text-[#b8c5df] uppercase tracking-wider">Legend (Focus Area)</p>
              <div className="grid grid-cols-1 gap-1.5">
                {Object.entries(FOCUS_LABELS).map(([id, label]) => (
                  <div key={id} className="flex items-center gap-2 text-[11px] text-[#e0ced1]">
                    <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: FOCUS_COLOR[id as keyof typeof FOCUS_COLOR] }} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1" />

        {/* Desktop metrics group (bottom right, desktop only, fixed) */}
        <div 
          ref={desktopMetricsRef}
          className="hidden md:fixed md:bottom-6 md:right-6 md:z-30 md:flex md:flex-row md:gap-3 md:max-w-[560px]"
        >
          <div className="rounded-lg bg-[rgba(255,255,255,0.12)] px-5 py-3 shadow-sm backdrop-blur-[18px] text-xs font-medium text-white text-center min-w-[110px]">
            <div className="text-xs text-[#9fb0d0]">Total Entries</div>
            <div className="text-lg font-bold text-white">{formatNumber(metrics.totalEntries)}</div>
          </div>
          <div className="rounded-lg bg-[rgba(255,255,255,0.12)] px-5 py-3 shadow-sm backdrop-blur-[18px] text-xs font-medium text-white text-center min-w-[110px]">
            <div className="text-xs text-[#9fb0d0]">Estimated Reach</div>
            <div className="text-lg font-bold text-white">{formatNumber(metrics.totalReach)}</div>
          </div>
          <div className="rounded-lg bg-[rgba(255,255,255,0.12)] px-5 py-3 shadow-sm backdrop-blur-[18px] text-xs font-medium text-white text-center min-w-[110px]">
            <div className="text-xs text-[#9fb0d0]">Countries</div>
            <div className="text-lg font-bold text-white">{formatNumber(metrics.countryCount)}</div>
          </div>
        </div>

        {/* Mobile metrics + bottom sheet group (mobile only) */}
        <div
          className={`fixed left-0 right-0 z-30 flex flex-col items-center transition-transform duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] md:hidden`}
          ref={mobileUIRef}
          style={{
            bottom: 0,
            transform: ((selectedEntryId || selectedCountry) && !isFullscreen) ? 'translateY(0)' : `translateY(calc(100% - ${(isFullscreen) ? 200 : 260}px))`,
          }}
        >
          <div className="flex mb-3 justify-between w-full px-4 z-200 pointer-events-auto">
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="z-100 flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,255,255,0.08)] text-white backdrop-blur-[18px] transition-all hover:bg-white/20 active:scale-95"
              title={isFullscreen ? "Show UI" : "Fullscreen Mode"}
            >
              <Icon icon={isFullscreen ? "mdi:fullscreen-exit" : "mdi:fullscreen"} className="h-6 w-6" />
            </button>

            <button
              type="button"
              onClick={() => setShowAbout(true)}
              className="z-100 flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,255,255,0.08)] text-white backdrop-blur-[18px] transition-all hover:bg-white/20 active:scale-95"
              title="About ECOSOC"
            >
              <Icon icon="mdi:help-circle-outline" className="h-6 w-6" />
            </button>
          </div>

          {/* Mobile Legend - Always visible on mobile, above metrics if bottom bar closed */}
          <div className="mb-3 flex w-[calc(100vw-24px)] max-w-[560px] flex-wrap justify-center gap-x-3 gap-y-1.5 rounded-[15px] bg-[rgba(255,255,255,0.08)] p-3 backdrop-blur-[18px]">
            {Object.entries(FOCUS_LABELS).map(([id, label]) => (
              <div key={id} className="flex items-center gap-1.5 text-[10px] text-[#e0ced1]">
                <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: FOCUS_COLOR[id as keyof typeof FOCUS_COLOR] }} />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div
            ref={metricsRef}
            className="pointer-events-none mb-2 flex w-[calc(100vw-24px)] max-w-[560px] flex-row items-end justify-center gap-2"
          >
            <div className="rounded-[10px] flex-1 bg-[rgba(255,255,255,0.12)] px-3 py-2 flex flex-row items-center justify-between gap-2 shadow-sm backdrop-blur-[18px] text-xs font-medium text-white">
              <span className="text-[11px] text-[#9fb0d0]">Total Entries</span>
              <span className="ml-2 text-base font-bold text-white">{compactNumber(metrics.totalEntries)}</span>
            </div>
            <div className="rounded-[10px] flex-1 bg-[rgba(255,255,255,0.12)] px-3 py-2 flex flex-row items-center justify-between gap-2 shadow-sm backdrop-blur-[18px] text-xs font-medium text-white">
              <span className="text-[11px] text-[#9fb0d0]">Est. Reach</span>
              <span className="ml-2 text-base font-bold text-white">{compactNumber(metrics.totalReach)}</span>
            </div>
            <div className="rounded-[10px] flex-1 bg-[rgba(255,255,255,0.12)] px-3 py-2 flex flex-row items-center justify-between gap-2 shadow-sm backdrop-blur-[18px] text-xs font-medium text-white">
              <span className="text-[11px] text-[#9fb0d0]">Countries</span>
              <span className="ml-2 text-base font-bold text-white">{compactNumber(metrics.countryCount)}</span>
            </div>
          </div>
          
          {/* mobile bottom bar */}
          <aside
            className="pointer-events-auto w-[calc(100vw-24px)] max-w-[560px] min-h-[140px] rounded-t-[22px] bg-[rgba(255,255,255,0.12)] p-4 backdrop-blur-[18px] md:hidden"
          >
            <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-white/35" />

            {!selectedEntryId && !selectedCountry ? (
              <div>
                <p className="text-sm font-semibold text-white/60">Click a point to view details</p>
              </div>
            ) : selectedEntryId ? (
              (() => {
                const entry = entryPoints.find(e => e.id === selectedEntryId)
                if (!entry) return <p className="text-sm text-[#e0ced1]">Entry not found.</p>
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white truncate">{entry.organizationName || 'Untitled Organization'}</p>
                      <button
                        type="button"
                        onClick={closeMobileBottomBar}
                        className="shrink-0 inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-xs font-medium text-[#d9e7ff]"
                      >
                        <Icon icon="mdi:close" className="h-3.5 w-3.5" />
                        Close
                      </button>
                    </div>
                    <article className="rounded-lg bg-white/5 p-3 flex flex-col gap-1 overflow-y-auto max-h-[30dvh]">
                      {entry.organizationDescription && (
                        <p className="text-xs text-[#e0e0e0] italic mb-1 whitespace-pre-line">{entry.organizationDescription}</p>
                      )}
                      <ul className="mt-1 mb-1 space-y-1 text-xs text-[#e0ced1]">
                        <li><span className="font-semibold text-[#B14242]">{CONSTRAINT_LABELS[entry.primaryConstraint] || entry.primaryConstraint}</span></li>
                        <li>{ROLE_LABELS[entry.roleType] || entry.roleType}</li>
                        <li>{FOCUS_LABELS[entry.focusArea] || entry.focusArea}</li>
                        {entry.estimatedReach > 0 && <li><span className="text-[#b8e986]">Reach: {formatNumber(entry.estimatedReach)}</span></li>}
                      </ul>
                      {entry.contact && (
                        <div className="pt-1 mt-1 border-t border-white/10">
                          <span className="text-xs text-[#d9e7ff] break-all">{entry.contact}</span>
                        </div>
                      )}
                    </article>
                  </div>
                )
              })()
            ) : selectedCountry && (
              (() => {
                const meta = countryMeta.get(selectedCountry!)
                if (!meta || meta.entries.length === 0) {
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-white">{selectedCountry}</p>
                        <button
                          type="button"
                          onClick={closeMobileBottomBar}
                          className="shrink-0 inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-xs font-medium text-[#d9e7ff]"
                        >
                          <Icon icon="mdi:close" className="h-3.5 w-3.5" />
                          Close
                        </button>
                      </div>
                      <div className="rounded-lg bg-white/5 p-4 text-center">
                        <p className="text-sm text-[#e0ced1]">No entries found</p>
                      </div>
                    </div>
                  )
                }
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">{selectedCountry}</p>
                      <button
                        type="button"
                        onClick={closeMobileBottomBar}
                        className="shrink-0 inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-xs font-medium text-[#d9e7ff]"
                      >
                        <Icon icon="mdi:close" className="h-3.5 w-3.5" />
                        Close
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg  bg-white/5 p-2.5">
                        <p className="text-[11px] text-[#e0ced1]">Entries</p>
                        <p className="text-sm font-semibold text-white">{compactNumber(meta.count)}</p>
                      </div>
                      <div className="rounded-lg  bg-white/5 p-2.5">
                        <p className="text-[11px] text-[#e0ced1]">Est. Reach</p>
                        <p className="text-sm font-semibold text-white">{compactNumber(meta.totalReach)}</p>
                      </div>
                    </div>

                    <div className="max-h-[30dvh] space-y-2 overflow-y-auto pr-1">
                      {meta.entries.map((entry) => (
                        <article key={entry.id} className="rounded-lg bg-white/10 p-2 flex flex-col gap-1">
                          <span className="text-xs text-white font-semibold">{entry.organizationName || 'Untitled Organization'}</span>
                          <span className="text-xs text-[#e0ced1]">{ROLE_LABELS[entry.roleType] || entry.roleType}</span>
                        </article>
                      ))}
                    </div>
                  </div>
                )
              })()
            )}
          </aside>
        </div>
      </section>
    </main>
  )
}

export default MapPage
