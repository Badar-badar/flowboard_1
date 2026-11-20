import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { createWorkspace } from '../store/workspace.thunks'
import { setActiveWorkspace } from '../store/workspace.slice'

export function useWorkspace() {
  const dispatch = useAppDispatch()
const { items, activeId, loaded, loading, creating, error } = useAppSelector((s) => s.workspace)

  return {
    workspaces: items,
    activeWorkspace: items.find((w) => w._id === activeId) ?? null,
    activeId,
    loaded,
    loading,
    creating,
    error,
    switchTo: (id: string) => dispatch(setActiveWorkspace(id)),
    addWorkspace: (name: string) => dispatch(createWorkspace({ name })).unwrap(),
  }
}
