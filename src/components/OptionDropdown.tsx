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
}

export function OptionDropdown({ label, options, value, onChange }: OptionDropdownProps) {
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
          className="flex w-full items-center justify-between rounded-[10px] bg-[rgba(255,255,255,0.15)] px-4 py-3 text-sm font-medium text-white transition-all hover:border-[rgba(255,255,255,0.25)] hover:bg-[rgba(255,255,255,0.2)]"
        >
          <span className={selectedOption ? '' : 'text-[#8b8b8b]'}>
            {selectedOption ? selectedOption.label : 'Select a constraint'}
          </span>
          <Icon icon="mdi:chevron-down" className={`h-6 w-6 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <ul className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-y-auto rounded-[10px] border border-[rgba(255,255,255,0.15)] bg-[#313131] shadow-lg animate-[countrySelectorFadeIn_180ms_ease-out]">
            {options.map((option) => (
              <li key={option.id}>
                <button
                  onClick={() => handleSelect(option.id)}
                  className={`w-full px-4 py-3 text-left text-sm font-medium transition-all ${
                    value === option.id
                      ? 'bg-[#3d6ec9] text-white'
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
