import { Check } from 'lucide-react'
import { PROJECT_COLORS } from '../project-constants'

export default function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PROJECT_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          style={{ backgroundColor: c }}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-900 hover:scale-110"
        >
          {value === c && <Check className="h-4 w-4" />}
        </button>
      ))}
    </div>
  )
}
