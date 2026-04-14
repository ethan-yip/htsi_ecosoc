import { useEffect, useRef, useState } from 'react'
import { Icon } from '@iconify/react'

interface OptionItem {
  id: string
  label: string
}

import type { ReactNode } from 'react'

interface OptionDropdownProps {
  label: ReactNode
  options: OptionItem[]
  value: string
  onChange: (id: string) => void
  placeholder?: string
}

export function OptionDropdown({ label, options, value, onChange, placeholder }: OptionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((option) => option.id === value)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (id: string) => {
    onChange(id)
    setIsOpen(false)
  }

  return (
    <div className="w-full" ref={dropdownRef}>
      <p className="mb-2 text-sm font-bold text-[#b3b3b3]">{label}</p>
      <div className="relative">
        <button
          onClick={() => setIsOpen((previous) => !previous)}
          className={`flex w-full items-center justify-between rounded-[10px] border transition-all px-4 py-3 text-sm font-medium text-white ${
            isOpen 
              ? 'bg-[rgba(255,255,255,0.1)] border-[#B14242]' 
              : 'bg-[rgba(255,255,255,0.15)] border-transparent hover:border-[rgba(255,255,255,0.25)] hover:bg-[rgba(255,255,255,0.2)]'
          }`}
        >
          <span className={selectedOption ? '' : 'text-[#8b8b8b]'}>
            {selectedOption ? selectedOption.label : (placeholder || 'Select an option')}
          </span>
          <Icon icon="mdi:chevron-down" className={`h-6 w-6 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <ul className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-y-auto rounded-[10px] border border-[rgba(255,255,255,0.15)] bg-[#3a0000] shadow-lg animate-[countrySelectorFadeIn_180ms_ease-out]">
            {options.map((option) => (
              <li key={option.id}>
                <button
                  onClick={() => handleSelect(option.id)}
                  className={`w-full px-4 py-3 text-left text-sm font-medium transition-all ${
                    value === option.id
                      ? 'bg-[#B14242] text-white'
                      : 'text-[#e0e0e0] hover:bg-[rgba(255,255,255,0.1)]'
                  }`}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
