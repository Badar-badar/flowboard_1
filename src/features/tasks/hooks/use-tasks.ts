import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import {
  fetchProjectTasks, fetchMyTasks, fetchTask, createTask,
  updateTask, deleteTask, uploadAttachments, deleteAttachment,
} from '../store/tasks.thunks'
import { selectTasksByProject, selectMyTasks, tasksSelectors, clearTasksError } from '../store/tasks.slice'
import type { ITasks } from '../types/tasks.types'

export function useTasks(projectId?: string) {
  const dispatch = useAppDispatch()
  const tasks = useAppSelector((s) => projectId ? selectTasksByProject(s, projectId) : [])
  const loaded = useAppSelector((s) => !!(projectId && s.tasks.loadedProjects[projectId]))
  const error = useAppSelector((s) => s.tasks.error)

  useEffect(() => {
    if (projectId) dispatch(fetchProjectTasks(projectId))
  }, [dispatch, projectId])

  return {
    tasks,
    loaded,
    error,
    clearError: () => dispatch(clearTasksError()),
    addTask: (data: ITasks.CreatePayload) => {
      if (!projectId) return Promise.reject(new Error('A project is required to create a task'))
      return dispatch(createTask({ projectId, data })).unwrap()
    },
    editTask: (id: string, changes: ITasks.UpdatePayload) => dispatch(updateTask({ id, changes })).unwrap(),
    removeTask: (id: string) => dispatch(deleteTask(id)).unwrap(),
    addFiles: (id: string, files: File[]) => dispatch(uploadAttachments({ id, files })).unwrap(),
    removeFile: (id: string, attachmentId: string) => dispatch(deleteAttachment({ id, attachmentId })).unwrap(),
  }
}

// one task for the side panel; fetches it if it isn't in the store yet (opened from a link)
export function useTask(id?: string) {
  const dispatch = useAppDispatch()
  const task = useAppSelector((s) => id ? tasksSelectors.selectById(s, id) : undefined)

  useEffect(() => {
    if (id) dispatch(fetchTask(id))
  }, [dispatch, id])

  return task
}

export function useMyTasks() {
  const dispatch = useAppDispatch()
  const tasks = useAppSelector(selectMyTasks)
  const loaded = useAppSelector((s) => s.tasks.myLoaded)
  const activeId = useAppSelector((s) => s.workspace.activeId)

  useEffect(() => {
    if (activeId) dispatch(fetchMyTasks())
  }, [dispatch, activeId])

  return {
    tasks,
    loaded,
    toggleDone: (task: ITasks.Task) =>
      dispatch(updateTask({ id: task._id, changes: { status: task.status === 'done' ? 'todo' : 'done' } })).unwrap(),
  }
}
