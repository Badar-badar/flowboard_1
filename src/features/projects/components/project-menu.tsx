import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronDown, ChevronRight, Link2, Settings, Trash2 } from 'lucide-react'
import Dropdown from '../../../components/ui/dropdown'
import { PROJECT_COLORS } from '../project-constants'
import { useProjects } from '../hooks/use-projects'
import { PATHS } from '../../../app/paths'
import type { IProjects } from '../types/projects.types'

const item = 'flex w-full items-center gap-3 px-4 py-2.5 text-left text-[15px] text-slate-100 hover:bg-white/5'

export default function ProjectMenu({ project, onEdit }: { project: IProjects.Project; onEdit: () => void }) {
  const navigate = useNavigate()
  const { editProject, removeProject } = useProjects()
  const [showColors, setShowColors] = useState(false)
  const [copied, setCopied] = useState(false)
  const isAdmin = project.role === 'admin'

  const copyLink = async (close: () => void) => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => { setCopied(false); close() }, 1200)
    } catch {
      close()
    }
  }

  const setColor = async (color: string) => {
    try { await editProject(project._id, { color }) } catch { /* shown on refetch */ }
  }

  const onDelete = async (close: () => void) => {
    close()
    if (!window.confirm(`Delete "${project.name}" and all its tasks? This cannot be undone.`)) return
    try {
      await removeProject(project._id)
      navigate(PATHS.projects, { replace: true })
    } catch (err) {
      window.alert(typeof err === 'string' ? err : 'Could not delete project')
    }
  }

  return (
    <Dropdown
      width="w-72"
      trigger={({ toggle }) => (
        <button onClick={toggle} className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white">
          <ChevronDown className="h-5 w-5" />
        </button>
      )}
    >
      {({ close }) => (
        <>
          {isAdmin && (
            <>
              <button className={item} onClick={() => { close(); onEdit() }}>
                <Settings className="h-5 w-5 text-slate-400" /> Edit project settings
              </button>

              <button className={item} onClick={() => setShowColors((v) => !v)}>
                <span className="h-5 w-5 rounded" style={{ backgroundColor: project.color }} />
                <span className="flex-1">Set color</span>
                <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${showColors ? 'rotate-90' : ''}`} />
              </button>
              {showColors && (
                <div className="flex flex-wrap gap-2 px-4 pb-3 pt-1">
                  {PROJECT_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      style={{ backgroundColor: c }}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-900 hover:scale-110"
                    >
                      {project.color === c && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              )}
              <hr className="my-1 border-white/10" />
            </>
          )}

          <button className={item} onClick={() => copyLink(close)}>
            {copied ? <Check className="h-5 w-5 text-emerald-400" /> : <Link2 className="h-5 w-5 text-slate-400" />}
            {copied ? 'Link copied' : 'Copy project link'}
          </button>

          {isAdmin && (
            <>
              <hr className="my-1 border-white/10" />
              <button className={`${item} !text-red-400`} onClick={() => onDelete(close)}>
                <Trash2 className="h-5 w-5" /> Delete project
              </button>
            </>
          )}
        </>
      )}
    </Dropdown>
  )
}
