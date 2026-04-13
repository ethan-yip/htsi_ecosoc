interface TextInputProps {
  label: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  isOptional?: boolean
}

export function TextInput({
  label,
  placeholder,
  value,
  onChange,
  isOptional = false,
}: TextInputProps) {
  return (
    <div className="w-full">
      <div className="mb-2 flex items-baseline gap-1">
        <p className="text-sm font-bold text-[#b3b3b3]">{label}</p>
        {isOptional && <span className="text-xs font-light text-[#b3b3b3]">(Optional)</span>}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[10px] border border-transparent bg-[rgba(255,255,255,0.15)] px-4 py-3 text-sm font-normal text-white placeholder-[#8b8b8b] outline-none transition-all hover:border-[rgba(255,255,255,0.25)] focus:border-[#3d6ec9] focus:bg-[rgba(255,255,255,0.2)]"
      />
    </div>
  )
}
