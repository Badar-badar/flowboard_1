import { ListTree } from 'lucide-react'

export default function ProjectIcon({ color, size = 'h-8 w-8' }: { color?: string; size?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-lg text-slate-900 ${size}`} style={{ backgroundColor: color }}>
      <ListTree className="h-1/2 w-1/2" />
    </span>
  )
}
