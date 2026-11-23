import ProjectIcon from './project-icon'

export default function ProjectPreview({ name, color }: { name: string; color: string }) {
  const bar = 'rounded bg-[#3a3b3d]'
  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <ProjectIcon color={color} size="h-14 w-14" />
        <span className="truncate text-xl text-white">{name || ' '}</span>
      </div>
      <div className="space-y-3 border-t border-white/10 pt-6">
        {[60, 40, 52, 35].map((w, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-white/10 pb-3">
            <span className="h-5 w-5 rounded-full border border-slate-500" />
            <span className={`h-3 ${bar}`} style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
    </div>
  )
}
