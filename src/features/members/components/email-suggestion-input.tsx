import { useMemo, useState } from 'react'
import { AtSign, Check, ChevronDown } from 'lucide-react'

export default function EmailSuggestionInput({ value, onChange, candidates = [], placeholder = 'name@example.com', label = 'Email address' }) {
  const [open, setOpen] = useState(false)
  const matches = useMemo(() => {
    const query = value.trim().toLowerCase()
    if (!query) return candidates.slice(0, 6)
    return candidates.filter((candidate) => `${candidate.name ?? ''} ${candidate.email ?? ''}`.toLowerCase().includes(query)).slice(0, 6)
  }, [candidates, value])

  return (
    <div className="relative">
      {label && <label className="mb-1.5 block text-sm text-slate-400">{label}</label>}
      <div className="flex h-11 items-center gap-2 rounded-lg border border-white/15 bg-[#1e1f21] px-3 focus-within:border-white/40">
        <AtSign className="h-4 w-4 shrink-0 text-slate-500" />
        <input value={value} onFocus={() => setOpen(true)} onBlur={() => window.setTimeout(() => setOpen(false), 120)} onChange={(event) => { onChange(event.target.value); setOpen(true) }} onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false) }} placeholder={placeholder} type="email" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" aria-label={label ?? placeholder} aria-autocomplete="list" />
        <button type="button" tabIndex={-1} onMouseDown={(event) => event.preventDefault()} onClick={() => setOpen((current) => !current)} aria-label="Show email suggestions" className="rounded p-1 text-slate-500 hover:bg-white/5 hover:text-white"><ChevronDown className="h-4 w-4" /></button>
      </div>
      {open && matches.length > 0 && <div role="listbox" className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-white/10 bg-[#2a2b2d] p-1 shadow-xl">
        {matches.map((candidate) => <button key={candidate.email} type="button" role="option" aria-selected={candidate.email.toLowerCase() === value.trim().toLowerCase()} onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(candidate.email); setOpen(false) }} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-white/[0.07]">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-200 text-xs font-medium text-slate-800">{(candidate.name ?? candidate.email).slice(0, 2).toUpperCase()}</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm text-slate-100">{candidate.name ?? candidate.email}</span>{candidate.name && <span className="block truncate text-xs text-slate-400">{candidate.email}</span>}</span>
          {candidate.email.toLowerCase() === value.trim().toLowerCase() && <Check className="h-4 w-4 text-blue-300" />}
        </button>)}
      </div>}
    </div>
  )
}
