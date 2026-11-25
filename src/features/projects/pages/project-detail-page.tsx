import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useProject } from '../hooks/use-projects'
import ProjectHeader from '../components/project-header'
import TaskListView from '../../tasks/components/task-list-view'
import TaskBoardView from '../../tasks/components/task-board-view'
import TaskPanel from '../../tasks/components/task-panel'
import ProjectOverview from '../components/project-overview'
import { PATHS } from '../../../app/paths'

export default function ProjectDetail() {
  const { id } = useParams()
  const { project, load, activeId } = useProject(id)
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
  }, [id, activeId])

  const openTask = (taskId: string) => setParams({ task: taskId })
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

  const View = view === 'board' ? TaskBoardView : TaskListView

  return (
    <div>
      <div className={`project-detail-scale ${view === 'board' ? 'project-detail-board' : ''}`}>
        <ProjectHeader project={project} view={view} onViewChange={setView} />
        {view === 'overview' ? (
          <ProjectOverview project={project} />
        ) : (
          <div className={view === 'board' ? 'project-detail-board-content' : undefined}>
            <View projectId={project._id} role={project.role} onOpen={openTask} />
          </div>
        )}
      </div>
      {openTaskId && <TaskPanel key={openTaskId} taskId={openTaskId} projectId={project._id} role={project.role} onClose={closeTask} />}
    </div>
  )
}
