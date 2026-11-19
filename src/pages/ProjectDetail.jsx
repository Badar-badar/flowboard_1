import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useProject } from '../features/projects/useProjects'
import ProjectHeader from '../components/projects/ProjectHeader'
import TaskListView from '../components/tasks/TaskListView'
import TaskBoardView from '../components/tasks/TaskBoardView'
import TaskPanel from '../components/tasks/TaskPanel'
import { PATHS } from '../routes/paths'

export default function ProjectDetail() {
  const { id } = useParams()
  const { project, load } = useProject(id)
  const [view, setView] = useState('list')
  const [state, setState] = useState('loading')
  const [params, setParams] = useSearchParams()
  const openTaskId = params.get('task')

  useEffect(() => {
    let cancelled = false
    setState(project ? 'ready' : 'loading')
    load()
      .then(() => !cancelled && setState('ready'))
      .catch((err) => !cancelled && setState(/not found/i.test(String(err)) ? 'notfound' : 'error'))
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const openTask = (taskId) => setParams({ task: taskId })
  const closeTask = () => setParams({})

  if (state === 'notfound') {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-300">Project not found, or you don't have access.</p>
        <Link to={PATHS.projects} className="mt-3 inline-block text-rose-400 hover:underline">Back to projects</Link>
      </div>
    )
  }
  if (state === 'error' && !project) return <p className="text-rose-400">Could not load this project.</p>
  if (!project) return <p className="text-slate-400">Loading...</p>

  const View = view === 'list' ? TaskListView : TaskBoardView

  return (
    <div>
      <ProjectHeader project={project} view={view} onViewChange={setView} />
      <View projectId={project._id} role={project.role} onOpen={openTask} />
      {openTaskId && <TaskPanel key={openTaskId} taskId={openTaskId} projectId={project._id} role={project.role} onClose={closeTask} />}
    </div>
  )
}