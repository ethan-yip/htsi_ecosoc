import { useState, useRef, useEffect } from 'react'
import { Icon } from '@iconify/react'
import countries from '../data/countries.json'

interface CountrySelectorProps {
  value: string
  onChange: (value: string) => void
}

interface CountryOption {
  label: string
  icon: string
}

const COUNTRY_OPTIONS = countries as CountryOption[]

export function CountrySelector({ value, onChange }: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredCountries = COUNTRY_OPTIONS.filter((country) =>
    country.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedCountry = COUNTRY_OPTIONS.find((country) => country.label === value)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (country: string) => {
    onChange(country)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div className="w-full" ref={dropdownRef}>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between rounded-[10px] bg-[rgba(255,255,255,0.15)] px-4 py-3 text-white transition-all hover:border-[rgba(255,255,255,0.25)] hover:bg-[rgba(255,255,255,0.2)]"
        >
          <div className="flex items-center gap-3">
            {selectedCountry ? (
              <Icon icon={selectedCountry.icon} className="h-6 w-6 shrink-0" />
            ) : (
              <Icon icon="mdi:earth" className="h-6 w-6 shrink-0 text-[#8b8b8b]" />
            )}
            <span className={`text-sm font-medium ${!value ? 'text-[#8b8b8b]' : ''}`}>
              {value || 'Select a country'}
            </span>
          </div>
          <Icon icon="mdi:chevron-down" className={`h-6 w-6 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-[10px] border border-[rgba(255,255,255,0.15)] bg-[#313131] shadow-lg animate-[countrySelectorFadeIn_180ms_ease-out]">
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search countries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-t-[10px] border-b border-[rgba(255,255,255,0.1)] bg-[#313131] px-4 py-3 text-sm font-normal text-white placeholder-[#8b8b8b] outline-none focus:bg-[rgba(255,255,255,0.05)]"
              autoFocus
            />

            {/* Country List */}
            <ul className="max-h-60 overflow-y-auto">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country) => (
                  <li key={country.label}>
                    <button
                      onClick={() => handleSelect(country.label)}
                      className={`w-full px-4 py-3 text-left text-sm font-medium transition-all ${
                        value === country.label
                          ? 'bg-[#3d6ec9] text-white'
                          : 'text-[#e0e0e0] hover:bg-[rgba(255,255,255,0.1)]'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon icon={country.icon} className="h-5 w-5 shrink-0" />
                        <span>{country.label}</span>
                      </span>
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-4 py-3 text-center text-sm text-[#8b8b8b]">
                  No countries found
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
