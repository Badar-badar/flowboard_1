import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, ChevronDown, LockKeyhole, Users } from 'lucide-react'
import { useProjects } from '../hooks/use-projects'
import ColorPicker from '../components/color-picker'
import ProjectPreview from '../components/project-preview-card'
import { PROJECT_COLORS } from '../project-constants'
import { PATHS } from '../../../app/paths'
import { useWorkspace } from '../../workspace/hooks/use-workspace'
import { useAuth } from '../../auth/hooks/use-auth'
import { workspaceApi } from '../../workspace/api/workspace.api'
import { membersApi } from '../../members/api/members.api'
import type { IProjects } from '../types/projects.types'
import type { FormEvent } from 'react'

const getErrorMessage = (error: unknown) =>
  error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : ''

export default function NewProject() {
  const navigate = useNavigate()
  const { addProject, creating } = useProjects()
  const { activeWorkspace, activeId: workspaceId } = useWorkspace()
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [color, setColor] = useState(() =>
    PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)]
  )
  const [nameTouched, setNameTouched] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [access, setAccess] = useState<'workspace' | 'private'>('workspace')
  const [accessMenuOpen, setAccessMenuOpen] = useState(false)
  const [createdProject, setCreatedProject] = useState<IProjects.Project | null>(null)
  const nameInvalid = name.trim().length < 2
  const showNameError = (nameTouched || submitted) && nameInvalid

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    const projectName = name.trim()
    if (projectName.length < 2) {
      return
    }
    try {
      if (createdProject) {
        navigate(PATHS.projectDetail(createdProject._id), { replace: true })
        return
      }
      const project = await addProject({ name: projectName, color })
      setCreatedProject(project)
      if (access === 'workspace' && workspaceId) {
        const workspaceMembers = (await workspaceApi.getMembers(workspaceId)).data ?? []
        const otherMembers = workspaceMembers.filter((member) => member.email?.toLowerCase() !== user?.email?.toLowerCase())
        const results = await Promise.allSettled(otherMembers.filter((member): member is typeof member & { email: string } => Boolean(member.email)).map((member) => membersApi.addToProject(project._id, { email: member.email, role: 'editor' })))
        const failedCount = results.filter((result) => result.status === 'rejected').length
        if (failedCount) {
          setError(`Project created. ${failedCount} workspace member${failedCount === 1 ? '' : 's'} could not be added. Open the project and invite them from Share.`)
          return
        }
      }
      navigate(PATHS.projectDetail(project._id), { replace: true })
    } catch (err) {
      if (createdProject) {
        setError(`Project created, but workspace access could not be set up. Open the project and invite members from Share. ${getErrorMessage(err)}`)
      } else setError(typeof err === 'string' ? err : getErrorMessage(err) || 'Could not create project')
    }
  }

  return (
    <div className="min-h-full bg-[#1e1f21] p-6 text-slate-200">
      <div className="mx-auto max-w-6xl">
      <Link to={PATHS.projects} className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Projects
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
            <label className="mb-2 block text-sm text-slate-300">Project access</label>
            <div className="relative">
              <button type="button" aria-expanded={accessMenuOpen} onClick={() => setAccessMenuOpen((open) => !open)} className="flex h-11 w-full items-center gap-3 rounded-lg border border-white/20 bg-[#242527] px-3 text-left text-sm text-slate-100 transition hover:border-white/35">
                {access === 'workspace' ? <Users className="h-4 w-4 text-slate-300" /> : <LockKeyhole className="h-4 w-4 text-slate-300" />}
                <span className="flex-1">{access === 'workspace' ? activeWorkspace?.name ?? 'My workspace' : 'Private'}</span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${accessMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {accessMenuOpen && <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-white/10 bg-[#292a2c] shadow-xl">
                <button type="button" onClick={() => { setAccess('workspace'); setAccessMenuOpen(false) }} className="flex w-full items-start gap-3 px-3 py-3 text-left transition hover:bg-white/5">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" /><span className="min-w-0 flex-1"><span className="block text-sm font-medium text-slate-100">{activeWorkspace?.name ?? 'My workspace'}</span><span className="mt-1 block text-xs leading-5 text-slate-400">Current workspace members will be added to this project.</span></span>{access === 'workspace' && <Check className="h-4 w-4 text-slate-300" />}
                </button>
                <button type="button" onClick={() => { setAccess('private'); setAccessMenuOpen(false) }} className="flex w-full items-start gap-3 border-t border-white/10 px-3 py-3 text-left transition hover:bg-white/5">
                  <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" /><span className="min-w-0 flex-1"><span className="block text-sm font-medium text-slate-100">Private</span><span className="mt-1 block text-xs leading-5 text-slate-400">Only you will have access until you invite project members.</span></span>{access === 'private' && <Check className="h-4 w-4 text-slate-300" />}
                </button>
              </div>}
            </div>
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
              {creating ? 'Creating...' : createdProject ? 'Open project' : 'Create project'}
            </button>
          </div>
        </form>
        <ProjectPreview name={name} color={color} />
      </div>
      </div>
    </div>
  )
}
