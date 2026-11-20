import ProjectIcon from './project-icon'

const rowWidths = ['80%', '60%', '72%', '45%']

export default function ProjectPreview({ name, color }) {
  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-[#252628]">
      <h2 className="border-b border-white/10 px-5 py-3 text-sm font-medium text-slate-300">
        Preview
      </h2>
      <div className="p-5">
        <div className="mb-5 flex min-w-0 items-center gap-3">
          <ProjectIcon color={color} size="h-10 w-10" />
          {name.trim() && <span className="truncate text-lg font-medium text-white">{name}</span>}
        </div>
        <div className="space-y-3 border-t border-white/10 pt-5">
          {rowWidths.map((width, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="h-4 w-4 shrink-0 rounded-full border border-slate-500" />
              <span className="h-2.5 rounded-full bg-[#3a3b3d]" style={{ width }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
