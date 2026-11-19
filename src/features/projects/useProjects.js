import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProjects, fetchProject, createProject, updateProject, deleteProject } from './projectsThunks'
import { projectsSelectors } from './projectsSlice'

// autoFetch: true in ONE always-mounted place (the sidebar), false elsewhere
export function useProjects({ autoFetch = false } = {}) {
  const dispatch = useDispatch()
  const projects = useSelector(projectsSelectors.selectAll)
  const { loaded, loading, creating, error } = useSelector((s) => s.projects)
  const activeId = useSelector((s) => s.workspace.activeId)

  useEffect(() => {
    if (autoFetch && activeId) dispatch(fetchProjects())
  }, [dispatch, autoFetch, activeId]) // refetches when the workspace changes

  return {
    projects,
    loaded,
    loading,
    creating,
    error,
    refetch: () => dispatch(fetchProjects()),
    addProject: (data) => dispatch(createProject(data)).unwrap(),
    editProject: (id, changes) => dispatch(updateProject({ id, changes })).unwrap(),
    removeProject: (id) => dispatch(deleteProject(id)).unwrap(),
  }
}

export function useProject(id) {
  const dispatch = useDispatch()
  const project = useSelector((s) => projectsSelectors.selectById(s, id))
  const activeId = useSelector((s) => s.workspace.activeId)

  const load = () => dispatch(fetchProject(id)).unwrap()
  return { project, load, activeId }
}