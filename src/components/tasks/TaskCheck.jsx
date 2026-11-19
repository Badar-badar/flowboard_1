import { Check } from 'lucide-react'

export default function TaskCheck({ done, disabled, onToggle }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onToggle() }}
      title={done ? 'Mark incomplete' : 'Mark complete'}
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
        done ? 'border-emerald-500 bg-emerald-500 text-slate-900' : 'border-slate-500 text-transparent hover:border-emerald-400 hover:text-emerald-400'
      } ${disabled ? 'cursor-default opacity-60' : ''}`}
    >
      <Check className="h-3 w-3" strokeWidth={3} />
    </button>
  )
}