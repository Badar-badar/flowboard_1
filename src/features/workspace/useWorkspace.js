import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchWorkspaces, createWorkspace } from './workspaceThunks'
import { setActiveWorkspace } from './workspaceSlice'

export function useWorkspace({ autoFetch = false } = {}) {
  const dispatch = useDispatch()
const { items, activeId, loaded, loading, creating, error } = useSelector((s) => s.workspace)

  useEffect(() => {
    if (autoFetch) dispatch(fetchWorkspaces())
  }, [dispatch, autoFetch])

  return {
    workspaces: items,
    activeWorkspace: items.find((w) => w._id === activeId) ?? null,
    activeId,
    loaded,
    loading,
    creating,
    error,
    switchTo: (id) => dispatch(setActiveWorkspace(id)),
    addWorkspace: (name) => dispatch(createWorkspace({ name })).unwrap(),
  }
}