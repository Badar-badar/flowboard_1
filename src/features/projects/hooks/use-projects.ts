import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { fetchProjects, fetchProject, createProject, updateProject, deleteProject, toggleProjectFavorite } from '../store/projects.thunks'
import { projectsSelectors } from '../store/projects.slice'
import type { IProjects } from '../types/projects.types'

// autoFetch: true in the always-mounted top bar; other consumers read its shared cache.
export function useProjects({ autoFetch = false }: { autoFetch?: boolean } = {}) {
  const dispatch = useAppDispatch()
  const projects = useAppSelector(projectsSelectors.selectAll)
  const { loaded, loading, creating, error } = useAppSelector((s) => s.projects)
  const cachedWorkspaceId = useAppSelector((s) => s.projects.workspaceId)
  const activeId = useAppSelector((s) => s.workspace.activeId)

  useEffect(() => {
    if (autoFetch && activeId && !(loaded && cachedWorkspaceId === activeId) && !(loading && cachedWorkspaceId === activeId)) {
      dispatch(fetchProjects(activeId))
    }
  }, [dispatch, autoFetch, activeId, loaded, loading, cachedWorkspaceId]) // fetch once when the workspace cache is empty

  return {
    projects,
    loaded,
    loading,
    creating,
    error,
    refetch: () => activeId ? dispatch(fetchProjects(activeId)) : Promise.resolve(null),
    addProject: (data: IProjects.CreatePayload) => dispatch(createProject(data)).unwrap(),
    editProject: (id: string, changes: IProjects.UpdatePayload) => dispatch(updateProject({ id, changes })).unwrap(),
    removeProject: (id: string) => dispatch(deleteProject(id)).unwrap(),
    toggleFavorite: (id: string) => dispatch(toggleProjectFavorite(id)).unwrap(),
  }
}

export function useProject(id?: string) {
  const dispatch = useAppDispatch()
  const project = useAppSelector((s) => id ? projectsSelectors.selectById(s, id) : undefined)
  const activeId = useAppSelector((s) => s.workspace.activeId)

  const load = () => id
    ? dispatch(fetchProject(id)).unwrap()
    : Promise.reject(new Error('Project ID is required'))
  return { project, load, activeId }
}
