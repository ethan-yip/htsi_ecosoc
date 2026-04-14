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
import { getEntryMetrics } from '../lib/map/clusterEntries'
import { getCountryByCode, getStateByCode } from '../lib/map/countryCentroids'
import { useEntries } from '../lib/supabase/useEntries'
import type { CountryCluster } from '../lib/map/clusterEntries'

const MAP_BG_IMAGE = 'http://localhost:3845/assets/770f7ff9674360b50f642756ea594971e9dabd10.png'

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

function MapPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { entries, isLoading, error, reload } = useEntries()
  const [selectedCluster, setSelectedCluster] = useState<CountryCluster | null>(null)
  const [globeSize, setGlobeSize] = useState({ width: 0, height: 0 })
  const [isLeaving, setIsLeaving] = useState(false)
  const pageRef = useRef<HTMLElement>(null)
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
  const headerRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLElement>(null)
  const metricsRef = useRef<HTMLDivElement>(null)
  const globeContainerRef = useRef<HTMLDivElement>(null)

  // Each entry gets a lat/lng at the country/state centroid
  // Add a small random offset to each entry's lat/lng to avoid perfect overlap
  // Type for entries with lat/lng
  type EntryWithCoords = typeof entries[number] & { lat: number; lng: number; countryName: string; stateName?: string };
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
          stateName
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
      const arr = map.get(entry.country)
      if (arr) {
        arr.count++
        arr.totalReach += entry.estimatedReach
        arr.entries.push(entry)
      } else {
        map.set(entry.country, { count: 1, totalReach: entry.estimatedReach, entries: [entry] })
      }
    }
    return map
  }, [entryPoints])

  const metrics = useMemo(() => getEntryMetrics(entries), [entries])

  // Selection: either an entry (by id) or a country (by name)
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)

  const animateBackToHome = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()

    if (isLeaving) {
      return
    }

    setIsLeaving(true)

    const timeline = gsap.timeline({
      onComplete: () => {
        navigate('/', { state: { fromMap: true } })
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
        [sidebarRef.current, metricsRef.current],
        { x: -24, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' },
        '-=0.25',
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

  useEffect(() => {
    const globe = globeRef.current
    if (!globe) {
      return
    }

    globe.pointOfView({ lat: 14, lng: 12, altitude: 1.9 }, 0)
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

  return (
    <main ref={pageRef} className="relative h-dvh overflow-hidden bg-[#0d1320] text-white">
      <div className="absolute inset-0 z-0">
        <img src={MAP_BG_IMAGE} alt="" className="h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(44,89,185,0.22),transparent_45%),radial-gradient(circle_at_80%_75%,rgba(15,194,158,0.17),transparent_40%),linear-gradient(180deg,rgba(8,13,24,0.82),rgba(8,13,24,0.92))]" />
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
              pointsData={entryPoints}
              pointLat="lat"
              pointLng="lng"
              pointColor={() => '#3d6ec9'}
              pointRadius={0.45}
              pointAltitude={0.04}
              pointLabel={(point) => {
                const entry = point as typeof entryPoints[number]
                return `${entry.organizationName || 'Untitled Organization'}\n${entry.stateName ? `${entry.stateName}, ` : ''}${entry.countryName}`
              }}
              onPointClick={(point) => {
                const entry = point as typeof entryPoints[number]
                setSelectedEntryId(entry.id)
                setSelectedCountry(null)
              }}
            />
          </div>
        )}
      </div>

      <div ref={headerRef} className="absolute left-1/2 top-5 z-20 w-[min(488px,calc(100%-1.5rem))] -translate-x-1/2 rounded-[25px] bg-[rgba(255,255,255,0.08)] p-[12px] backdrop-blur-[18px] md:top-8 md:w-[min(488px,calc(100%-2rem))] md:p-[15px]">
        <div className="relative mb-[5px] flex min-h-10 items-center justify-center md:min-h-0">
          <Link
            to="/"
            onClick={animateBackToHome}
            className="absolute left-0 inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-[#e0e0e0] backdrop-blur-[12px] transition hover:bg-white/20 md:hidden"
          >
            <Icon icon="mdi:arrow-left" className="h-3.5 w-3.5" />
            Back
          </Link>
          <h1 className="rounded-[10px] px-5 py-2 text-lg font-bold text-white md:text-[20px]">Map App Thingy</h1>
        </div>

        <div className="grid grid-cols-2 rounded-[35px] bg-[rgba(255,255,255,0.1)] p-[2px]">
          <Link
            to="/"
            onClick={animateBackToHome}
            className="flex h-9 items-center justify-center gap-2 rounded-[20px] text-sm font-medium text-[#cfcfcf] transition hover:text-[#e6e6e6]"
          >
            <Icon icon="mdi:list-box-outline" className="h-[22px] w-[22px]" />
            <span>Input View</span>
          </Link>
          <div className="flex h-9 items-center justify-center gap-2 rounded-[20px] bg-[rgba(255,255,255,0.1)] text-sm font-bold text-white">
            <Icon icon="mdi-light:map-marker" className="h-[22px] w-[22px]" />
            <span>Map</span>
          </div>
        </div>
      </div>

      <Link
        to="/"
        onClick={animateBackToHome}
        className="absolute right-6 top-6 z-20 hidden items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-[#e0e0e0] backdrop-blur-[12px] transition hover:bg-white/20 md:inline-flex"
      >
        <Icon icon="mdi:arrow-left" className="h-4 w-4" />
        Back
      </Link>

      <section className="pointer-events-none relative z-10 h-full px-4 pb-4 pt-36 md:px-6 md:pb-6 md:pt-40">

        <aside ref={sidebarRef} className="pointer-events-auto absolute bottom-0 left-0 top-0 hidden w-[285px] overflow-y-auto m-3 rounded-[20px] bg-[rgba(255,255,255,0.08)] p-5 backdrop-blur-[30px] md:block">
          <h2 className="mb-3 text-base font-semibold text-white">Details</h2>
          {/* Country selection UI */}
          <div className="mb-3">
            <label className="block text-xs text-[#b8c5df] mb-1">Select Country</label>
            <select
              className="w-full rounded bg-[#232b3a] text-white text-sm p-1 mb-2"
              value={selectedCountry || ''}
              onChange={e => {
                setSelectedCountry(e.target.value || null)
                setSelectedEntryId(null)
              }}
            >
              <option value="">--</option>
              {[...countryMeta.keys()].sort().map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
          {!selectedEntryId && !selectedCountry ? (
            <p className="text-sm text-[#c4d0e8]">Click a point to view entry details, or select a country for summary.</p>
          ) : selectedEntryId ? (
            (() => {
              const entry = entryPoints.find(e => e.id === selectedEntryId)
              if (!entry) return <p className="text-sm text-[#c4d0e8]">Entry not found.</p>
              return (
                <article className="rounded-lg bg-white/5 p-3 flex flex-col gap-1">
                  <p className="text-sm font-bold text-white whitespace-pre-line">{entry.organizationName || 'Untitled Organization'}</p>
                  {entry.organizationDescription && (
                    <p className="text-xs text-[#e0e0e0] italic mb-1 whitespace-pre-line">{entry.organizationDescription}</p>
                  )}
                  <ul className="mt-1 mb-1 space-y-1 text-xs text-[#c4d0e8]">
                    <li><span className="font-semibold text-[#f2b223]">{CONSTRAINT_LABELS[entry.primaryConstraint] || entry.primaryConstraint}</span></li>
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
              )
            })()
          ) : (
            (() => {
              const meta = countryMeta.get(selectedCountry!)
              if (!meta) return <p className="text-sm text-[#c4d0e8]">Country not found.</p>
              return (
                <div className="space-y-3">
                  <div className="rounded-lg bg-white/5 p-3">
                    <p className="text-xs text-[#c4d0e8]">Country</p>
                    <p className="text-base font-semibold text-white">{selectedCountry}</p>
                  </div>
                  <div className="rounded-lg bg-white/5 p-3">
                    <p className="text-xs text-[#c4d0e8]">Entries</p>
                    <p className="text-base font-semibold text-white">{formatNumber(meta.count)}</p>
                  </div>
                  <div className="rounded-lg bg-white/5 p-3">
                    <p className="text-xs text-[#c4d0e8]">Estimated Reach</p>
                    <p className="text-base font-semibold text-white">{formatNumber(meta.totalReach)}</p>
                  </div>
                  <div className="space-y-3">
                    {meta.entries.map((entry) => (
                      entry && (
                        <article key={entry.id} className="rounded-lg bg-white/10 p-2 flex flex-col gap-1">
                          <span className="text-xs text-white font-semibold">{entry.organizationName || 'Untitled Organization'}</span>
                          <span className="text-xs text-[#c4d0e8]">{ROLE_LABELS[entry.roleType] || entry.roleType}</span>
                        </article>
                      )
                    ))}
                  </div>
                </div>
              )
            })()
          )}
        </aside>

        {/* Desktop metrics group (bottom right, desktop only, fixed) */}
        <div className="hidden md:fixed md:bottom-6 md:right-6 md:z-30 md:flex md:flex-row md:gap-3 md:max-w-[560px]">
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
          className={`fixed left-0 right-0 z-30 flex flex-col items-center transition-transform duration-300 md:hidden`}
          style={{
            bottom: 0,
            transform: selectedCluster ? 'translateY(0)' : 'translateY(calc(100% - 115px))',
          }}
        >
          <div
            ref={metricsRef}
            className="pointer-events-none mb-2 flex w-[calc(100vw-32px)] max-w-[560px] flex-row items-end justify-center gap-2"
          >
            <div className="rounded-[10px]  bg-[rgba(255,255,255,0.12)] px-3 py-2 flex flex-row items-center justify-between gap-2 shadow-sm backdrop-blur-[18px] text-xs font-medium text-white">
              <span className="text-[11px] text-[#9fb0d0]">Total Entries</span>
              <span className="ml-2 text-base font-bold text-white">{formatNumber(metrics.totalEntries)}</span>
            </div>
            <div className="rounded-[10px]  bg-[rgba(255,255,255,0.12)] px-3 py-2 flex flex-row items-center justify-between gap-2 shadow-sm backdrop-blur-[18px] text-xs font-medium text-white">
              <span className="text-[11px] text-[#9fb0d0]">Estimated Reach</span>
              <span className="ml-2 text-base font-bold text-white">{formatNumber(metrics.totalReach)}</span>
            </div>
            <div className="rounded-[10px]  bg-[rgba(255,255,255,0.12)] px-3 py-2 flex flex-row items-center justify-between gap-2 shadow-sm backdrop-blur-[18px] text-xs font-medium text-white">
              <span className="text-[11px] text-[#9fb0d0]">Countries</span>
              <span className="ml-2 text-base font-bold text-white">{formatNumber(metrics.countryCount)}</span>
            </div>
          </div>
          
          <aside
            className="pointer-events-auto w-[calc(100vw-24px)] max-w-[560px] rounded-t-[22px]  bg-[rgba(255,255,255,0.12)] p-4 backdrop-blur-[18px] md:hidden"
          >
            <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-white/35" />

            {!selectedCluster ? (
              <div>
                <p className="text-sm font-semibold text-white/60">Click a country point to view details</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{selectedCluster.country}</p>
                  <button
                    type="button"
                    onClick={() => setSelectedCluster(null)}
                    className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-xs font-medium text-[#d9e7ff]"
                  >
                    <Icon icon="mdi:close" className="h-3.5 w-3.5" />
                    Close
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg  bg-white/5 p-2.5">
                    <p className="text-[11px] text-[#c4d0e8]">Entries</p>
                    <p className="text-sm font-semibold text-white">{formatNumber(selectedCluster.count)}</p>
                  </div>
                  <div className="rounded-lg  bg-white/5 p-2.5">
                    <p className="text-[11px] text-[#c4d0e8]">Est. Reach</p>
                    <p className="text-sm font-semibold text-white">{formatNumber(selectedCluster.totalReach)}</p>
                  </div>
                </div>

                <div className="max-h-[30dvh] space-y-2 overflow-y-auto pr-1">
                  {selectedCluster.entries.map((entry) => (
                    <article key={entry.id} className="rounded-lg bg-white/5 p-3 flex flex-col gap-1">
                      <p className="text-sm font-bold text-white whitespace-pre-line">{entry.organizationName || 'Untitled Organization'}</p>
                      {entry.organizationDescription && (
                        <p className="text-xs text-[#e0e0e0] italic mb-1 whitespace-pre-line">{entry.organizationDescription}</p>
                      )}
                      <ul className="mt-1 mb-1 space-y-1 text-xs text-[#c4d0e8]">
                        <li><span className="font-semibold text-[#f2b223]">{CONSTRAINT_LABELS[entry.primaryConstraint] || entry.primaryConstraint}</span></li>
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
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  )
}

export default MapPage
