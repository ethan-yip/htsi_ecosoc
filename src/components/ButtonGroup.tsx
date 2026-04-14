interface ButtonOption {
  id: string
  label: string
}

import type { ReactNode } from 'react'

interface ButtonGroupProps {
  options: ButtonOption[]
  selected: string
  onSelect: (id: string) => void
  label?: ReactNode
  stackOnMobile?: boolean
  wrapOnMobile?: boolean
  compactWrap?: boolean
}

export function ButtonGroup({
  options,
  selected,
  onSelect,
  label,
  stackOnMobile = false,
  wrapOnMobile = false,
  compactWrap = false,
}: ButtonGroupProps) {
  return (
    <div className="w-full">
      {label && <p className="mb-2 text-sm font-bold text-[#b3b3b3]">{label}</p>}
      <div
        className={
          wrapOnMobile
            ? 'flex flex-wrap gap-2.5'
            : compactWrap
              ? 'flex flex-wrap gap-2'
            : stackOnMobile
              ? 'flex flex-col gap-2.5 sm:flex-row'
              : 'flex gap-2.5'
        }
      >
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={`${
              wrapOnMobile
                ? 'min-w-[calc(50%-0.3125rem)] flex-1'
                : compactWrap
                  ? 'w-fit max-w-full'
                : stackOnMobile
                  ? 'w-full sm:flex-1'
                  : 'flex-1'
            } rounded-[15px] px-4 py-2.5 text-center text-sm font-medium transition-all ${
              selected === option.id
                ? 'bg-[#B14242] text-white shadow-lg'
                : 'bg-[rgba(255,255,255,0.1)] text-[#cfcfcf] hover:bg-[rgba(255,255,255,0.15)]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
