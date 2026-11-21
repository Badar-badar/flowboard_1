import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { fetchProjects, fetchProject, createProject, updateProject, deleteProject, toggleProjectFavorite } from '../store/projects.thunks'
import { projectsSelectors } from '../store/projects.slice'

// autoFetch: true in ONE always-mounted place (the sidebar), false elsewhere
export function useProjects({ autoFetch = false } = {}) {
  const dispatch = useAppDispatch()
  const projects = useAppSelector(projectsSelectors.selectAll)
  const { loaded, loading, creating, error } = useAppSelector((s) => s.projects)
  const activeId = useAppSelector((s) => s.workspace.activeId)

  useEffect(() => {
    if (autoFetch && activeId) dispatch(fetchProjects(activeId))
  }, [dispatch, autoFetch, activeId]) // refetches when the workspace changes

  return {
    projects,
    loaded,
    loading,
    creating,
    error,
    refetch: () => activeId ? dispatch(fetchProjects(activeId)) : Promise.resolve(null),
    addProject: (data) => dispatch(createProject(data)).unwrap(),
    editProject: (id, changes) => dispatch(updateProject({ id, changes })).unwrap(),
    removeProject: (id) => dispatch(deleteProject(id)).unwrap(),
    toggleFavorite: (id) => dispatch(toggleProjectFavorite(id)).unwrap(),
  }
}

export function useProject(id) {
  const dispatch = useAppDispatch()
  const project = useAppSelector((s) => projectsSelectors.selectById(s, id))
  const activeId = useAppSelector((s) => s.workspace.activeId)

  const load = () => dispatch(fetchProject(id)).unwrap()
  return { project, load, activeId }
}
