import { useEffect, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { useFormContext } from '../lib/form/useFormContext'
import { getStatesOfCountry } from '../lib/map/countryCentroids'
import type { FocusArea, PrimaryConstraint, RoleType } from '../lib/form/formState'
import { CountrySelector } from './CountrySelector'
import { ButtonGroup } from './ButtonGroup'
import { OptionDropdown } from './OptionDropdown'
import { TextInput } from './TextInput'
import { FormActions } from './FormActions'

const ROLE_OPTIONS = [
  { id: 'youth-program-operator', label: 'Youth Program Operator', description: 'Runs programs' },
  { id: 'ngo-nonprofit', label: 'NGO / Nonprofit' },
  { id: 'school-university', label: 'School / University' },
  { id: 'startup-builder', label: 'Startup / Builder' },
  { id: 'government-policy', label: 'Government / Policy' },
  { id: 'funder-donor', label: 'Funder / Donor' },
  { id: 'other', label: 'Other' },
]

const FOCUS_AREA_OPTIONS = [
  { id: 'entrepreneurship', label: 'Entrepreneurship' },
  { id: 'education', label: 'Education' },
  { id: 'employment', label: 'Employment' },
  { id: 'peacebuilding-civic-engagement', label: 'Peacebuilding / Civic Engagement' },
  { id: 'technology-innovation', label: 'Technology / Innovation' },
  { id: 'other', label: 'Other' },
]

const CONSTRAINT_OPTIONS = [
  { id: 'funding', label: 'Funding' },
  { id: 'execution-capacity', label: 'Execution Capacity', description: 'People, delivery' },
  { id: 'engagement', label: 'Engagement', description: 'Getting/retaining youth' },
  { id: 'institutional-support', label: 'Institutional Support' },
  { id: 'training-skills', label: 'Training / Skills' },
  { id: 'other', label: 'Other' },
]

interface FormInputViewProps {
  activeTab: 'input' | 'map'
  setActiveTab: (tab: 'input' | 'map') => void
}

export function FormInputView({ activeTab, setActiveTab }: FormInputViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showScrollHint, setShowScrollHint] = useState(true)
  const { formState, updateFormState } = useFormContext()

  useEffect(() => {
    const element = scrollContainerRef.current
    if (!element || activeTab !== 'input') {
      return
    }

    const updateScrollHint = () => {
      const hasOverflow = element.scrollHeight > element.clientHeight + 4
      const reachedBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 4
      setShowScrollHint(hasOverflow && !reachedBottom)
    }

    const frameId = requestAnimationFrame(updateScrollHint)
    element.addEventListener('scroll', updateScrollHint, { passive: true })
    window.addEventListener('resize', updateScrollHint)

    return () => {
      cancelAnimationFrame(frameId)
      element.removeEventListener('scroll', updateScrollHint)
      window.removeEventListener('resize', updateScrollHint)
    }
  }, [activeTab])

  return (
    <div className="flex h-full w-full max-w-2xl flex-col rounded-[15px] py-[clamp(10px,1.8vh,22px)] md:h-[calc(100dvh-16px)] md:w-[min(50vw,720px)] md:max-w-none md:px-8">
      {/* Header */}
      <div className="home-form-anim mb-[clamp(12px,2vh,24px)] hidden w-full justify-center text-center md:flex">
        <h1 className="text-xl font-bold text-white px-[20px] py-[15px] bg-white/10 w-fit rounded-xl">Map App Thingy</h1>
      </div>

      {/* Tab Navigation (Desktop) */}
      <div className="home-form-anim mb-[clamp(10px,1.6vh,14px)] hidden w-full gap-1 rounded-[22px] bg-[rgba(255,255,255,0.08)] p-1 md:inline-flex">
        <button
          onClick={() => setActiveTab('input')}
          className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-[18px] px-4 text-sm font-medium transition-all ${
            activeTab === 'input'
              ? 'bg-[rgba(255,255,255,0.1)] text-[#e0e0e0]'
              : 'text-[#8e8e8e] hover:text-[#e0e0e0]'
          }`}
        >
          <Icon icon="mdi:list-box-outline" className="h-6 w-6 shrink-0 text-current" />
          <span>Input View</span>
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-[18px] px-4 text-sm font-medium transition-all ${
            activeTab === 'map'
              ? 'bg-[rgba(255,255,255,0.1)] text-[#e0e0e0]'
              : 'text-[#8e8e8e] hover:text-[#e0e0e0]'
          }`}
        >
          <Icon icon="mdi-light:map-marker" className="h-6 w-6 shrink-0 text-current" />
          <span>Map</span>
        </button>
      </div>

      {/* Form Content */}
      {activeTab === 'input' && (
        <div className="home-form-anim relative min-h-0 flex-1 rounded-[20px] bg-[#313131] px-4 py-5 md:px-[24px] md:py-[clamp(18px,3vh,30px)]">
          <div
            ref={scrollContainerRef}
            className="h-full overflow-y-auto [scrollbar-gutter:stable]"
          >
            <div className="flex min-h-full flex-col justify-between gap-[clamp(14px,2vh,20px)] md:gap-5">
              {/* Country Selector */}
              <div>
                <div className="mb-2 text-sm font-bold text-[#b3b3b3] flex items-center gap-1">
                  <span>Country</span>
                  <span className="text-[#e57373]">*</span>
                </div>
                <CountrySelector
                  value={formState.country}
                  onChange={(value) => {
                    updateFormState({ country: value, state: '' })
                  }}
                />
                {formState.country && (
                  (() => {
                    const states = getStatesOfCountry(formState.country);
                    if (states.length === 0) return null;
                    return (
                      <div className="mt-3">
                        <OptionDropdown
                          label={<span>State / Region <span className="text-[#e57373]">*</span></span>}
                          options={states.map(s => ({ id: s.name, label: s.name }))}
                          value={formState.state}
                          onChange={id => updateFormState({ state: id })}
                          placeholder="Select a state / region"
                        />
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Role Type */}
              <ButtonGroup
                label={<span>Which best describes your role? <span className="text-[#e57373]">*</span></span>}
                options={ROLE_OPTIONS}
                selected={formState.roleType}
                onSelect={(id) => updateFormState({ roleType: id as RoleType })}
                wrapOnMobile
              />

              {/* Primary Focus Area */}
              <ButtonGroup
                label={<span>What is your main focus? <span className="text-[#e57373]">*</span></span>}
                options={FOCUS_AREA_OPTIONS}
                selected={formState.focusArea}
                onSelect={(id) => updateFormState({ focusArea: id as FocusArea })}
                compactWrap
              />

              {/* Organization / Initiative Name */}
              <TextInput
                label="Organization / Initiative Name"
                placeholder="Optional, but important"
                value={formState.organizationName}
                onChange={(value) => updateFormState({ organizationName: value })}
                isOptional
              />

              {/* Organization Description */}
              <div className="w-full">
                <div className="mb-2 flex items-baseline gap-1">
                  <p className="text-sm font-bold text-[#b3b3b3]">Description</p>
                  <span className="text-xs font-light text-[#b3b3b3]">(Optional)</span>
                </div>
                <textarea
                  id="org-description"
                  value={formState.description}
                  onChange={e => updateFormState({ description: e.target.value })}
                  placeholder="Describe your organization or initiative (optional)"
                  rows={4}
                  className="w-full rounded-[10px] border border-transparent bg-[rgba(255,255,255,0.15)] px-4 py-3 text-sm font-normal text-white placeholder-[#8b8b8b] outline-none transition-all hover:border-[rgba(255,255,255,0.25)] focus:border-[#3d6ec9] focus:bg-[rgba(255,255,255,0.2)] resize-vertical min-h-[70px]"
                />
              </div>

              {/* Primary Constraint */}
              <OptionDropdown
                label={<span>What is your biggest constraint right now? <span className="text-[#e57373]">*</span></span>}
                options={CONSTRAINT_OPTIONS}
                value={formState.primaryConstraint}
                onChange={(id) => updateFormState({ primaryConstraint: id as PrimaryConstraint })}
                placeholder="Select a constraint"
              />

              {/* Estimated Youth Reach */}
              <TextInput
                label="Roughly how many youth do you reach?"
                placeholder="Optional"
                value={formState.estimatedYouthReach}
                onChange={(value) => updateFormState({ estimatedYouthReach: value })}
                isOptional
              />

              {/* Contact */}
              <TextInput
                label="Contact"
                placeholder="LinkedIn or Email"
                value={formState.contact}
                onChange={(value) => updateFormState({ contact: value })}
                isOptional
              />
            </div>
          </div>

          <div
            className={`pointer-events-none absolute inset-x-2 bottom-3 flex min-h-14 items-end justify-center rounded-xl bg-[linear-gradient(to_top,rgba(49,49,49,0.86),rgba(49,49,49,0.18),rgba(49,49,49,0))] px-2 pb-1 backdrop-blur-[1.5px] transition-opacity duration-200 ${showScrollHint ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="flex items-center justify-center gap-1 text-[11px] font-medium tracking-[0.04em] text-[#b1b1b1]">
              <span>Scroll for more</span>
              <Icon icon="mdi:chevron-double-down" className="h-4 w-4" />
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="home-form-anim shrink-0">
        <FormActions />
      </div>

    </div>
  )
}
