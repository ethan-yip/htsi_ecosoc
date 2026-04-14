import { useLayoutEffect, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { useLocation, useNavigate } from 'react-router'
import gsap from 'gsap'
import { FormProvider } from '../lib/form/FormContext'
import { FormInputView } from '../components/FormInputView'

function InputPage() {
  const [activeTab, setActiveTab] = useState<'input' | 'map'>('input')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const topBarRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const timeline = gsap.timeline()
    const formAnimTargets = contentRef.current?.querySelectorAll('.home-form-anim')
    const fromMap = Boolean((location.state as { fromMap?: boolean } | null)?.fromMap)

    timeline
      .fromTo(
        [topBarRef.current, footerRef.current],
        { opacity: 0, y: fromMap ? -8 : 8 },
        { opacity: 1, y: 0, duration: 0.42, ease: 'power2.out' },
      )
      .fromTo(
        contentRef.current,
        { opacity: 0, y: fromMap ? 10 : 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
        '-=0.2',
      )

    if (formAnimTargets && formAnimTargets.length > 0) {
      timeline.fromTo(
        formAnimTargets,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', stagger: 0.08 },
        '-=0.25',
      )
    }

    return () => {
      timeline.kill()
    }
  }, [location.state])

  const handleTabChange = (tab: 'input' | 'map') => {
    if (tab === 'input') {
      setActiveTab('input')
      return
    }

    if (isTransitioning) {
      return
    }

    setIsTransitioning(true)

    const timeline = gsap.timeline({
      onComplete: () => {
        navigate('/', { state: { fromHome: true } })
      },
    })

    timeline
      .to(contentRef.current, {
        opacity: 0,
        y: 24,
        duration: 0.35,
        ease: 'power2.inOut',
      })
      .to(
        [topBarRef.current, footerRef.current],
        {
          backgroundColor: 'rgba(255,255,255,0.16)',
          backdropFilter: 'blur(8px)',
          duration: 0.3,
          ease: 'power2.out',
        },
        '<',
      )
  }

  return (
    <main className="relative h-dvh overflow-hidden bg-[#1b1b1b]">
      <div ref={topBarRef} className="absolute inset-x-0 top-0 z-20 flex h-[8vh] w-full items-center justify-center bg-[rgba(255,255,255,0.1)] md:hidden">
        <h1 className="px-6 py-4 text-lg font-bold text-white">Map App Thingy</h1>
      </div>

      <FormProvider>
        <div ref={contentRef} className="flex h-full items-start justify-center px-3 pt-[calc(8vh+8px)] pb-[8vh] md:items-center md:pt-[clamp(8px,1.8vh,18px)] md:pb-[clamp(8px,1.8vh,18px)]">
          <FormInputView activeTab={activeTab} setActiveTab={handleTabChange} />
        </div>
      </FormProvider>

      <div ref={footerRef} className="absolute inset-x-0 bottom-0 h-[8vh] w-full bg-[rgba(255,255,255,0.1)] md:hidden">
        <div className="mx-auto flex h-full w-full max-w-[430px] items-center justify-around px-6">
          <button
            onClick={() => handleTabChange('input')}
            className={`flex h-[46px] w-16 items-center justify-center rounded-[20px] transition-all ${
              activeTab === 'input' ? 'bg-[rgba(255,255,255,0.1)] text-[#f2f2f2]' : 'text-[#8e8e8e]'
            }`}
            aria-label="Input View"
            disabled={isTransitioning}
          >
            <Icon icon="mdi:list-box-outline" className="h-8 w-8 shrink-0" />
          </button>

          <button
            onClick={() => handleTabChange('map')}
            className={`flex h-[46px] w-16 items-center justify-center rounded-[20px] transition-all ${
              activeTab === 'map' ? 'bg-[rgba(255,255,255,0.1)] text-[#f2f2f2]' : 'text-[#8e8e8e]'
            }`}
            aria-label="Map"
            disabled={isTransitioning}
          >
            <Icon icon="mdi-light:map-marker" className="h-8 w-8 shrink-0" />
          </button>
        </div>
      </div>
    </main>
  )
}

export default InputPage
