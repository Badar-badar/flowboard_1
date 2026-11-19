import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProjects } from '../features/projects/useProjects'
import ColorPicker from '../components/projects/ColorPicker'
import ProjectPreview from '../components/projects/ProjectPreview'
import { PROJECT_COLORS } from '../lib/projectConstants'
import { PATHS } from '../routes/paths'

export default function NewProject() {
  const navigate = useNavigate()
  const { addProject, creating } = useProjects()
  const [name, setName] = useState('')
  const [color, setColor] = useState(() =>
    PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)]
  )
  const [nameTouched, setNameTouched] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const nameInvalid = name.trim().length < 2
  const showNameError = (nameTouched || submitted) && nameInvalid

  const onSubmit = async (event) => {
    event.preventDefault()
    setSubmitted(true)
    const projectName = name.trim()
    if (projectName.length < 2) {
      return
    }
    try {
      const project = await addProject({ name: projectName, color })
      navigate(PATHS.projectDetail(project._id), { replace: true })
    } catch (err) {
      setError(typeof err === 'string' ? err : err?.message || 'Could not create project')
    }
  }

  return (
    <div className="min-h-full bg-[#1e1f21] p-6 text-slate-200">
      <div className="mx-auto max-w-6xl">
      <Link to={PATHS.projects} className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <span aria-hidden="true">←</span> Projects
      </Link>
      <h1 className="mb-8 text-3xl font-semibold text-white">Create a project</h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16">
        <form onSubmit={onSubmit} className="w-full max-w-md space-y-6">
          <div>
            <label htmlFor="project-name" className="mb-2 block text-sm text-slate-300">Project name</label>
            <input
              id="project-name"
              autoFocus
              maxLength={120}
              value={name}
              onBlur={() => setNameTouched(true)}
              onChange={(event) => { setName(event.target.value); setError('') }}
              placeholder="e.g. Website redesign"
              className={`w-full rounded-lg border ${showNameError ? 'border-red-400' : 'border-white/15'} bg-[#2a2b2d] px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-white/40`}
            />
            {showNameError && (
              <p className="mt-2 text-sm text-red-400">Project name is required.</p>
            )}
          </div>
          <div>
            <p className="mb-2 text-sm text-slate-300">Project color</p>
            <div className="[&>div>button]:h-10 [&>div>button]:w-10">
              <ColorPicker value={color} onChange={setColor} />
            </div>
          </div>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => navigate(PATHS.projects)} className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-white/5">Cancel</button>
            <button disabled={creating} className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 disabled:opacity-50">
              {creating ? 'Creating...' : 'Create project'}
            </button>
          </div>
        </form>
        <ProjectPreview name={name} color={color} />
      </div>
      </div>
    </div>
  )
}
