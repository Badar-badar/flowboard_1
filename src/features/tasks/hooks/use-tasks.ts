import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import {
  fetchProjectTasks, fetchMyTasks, fetchTask, createTask,
  updateTask, deleteTask, uploadAttachments, deleteAttachment,
} from '../store/tasks.thunks'
import { selectTasksByProject, selectMyTasks, tasksSelectors, clearTasksError } from '../store/tasks.slice'

export function useTasks(projectId) {
  const dispatch = useAppDispatch()
  const tasks = useAppSelector((s) => selectTasksByProject(s, projectId))
  const loaded = useAppSelector((s) => !!s.tasks.loadedProjects[projectId])
  const error = useAppSelector((s) => s.tasks.error)

  useEffect(() => {
    if (projectId) dispatch(fetchProjectTasks(projectId))
  }, [dispatch, projectId])

  return {
    tasks,
    loaded,
    error,
    clearError: () => dispatch(clearTasksError()),
    addTask: (data) => dispatch(createTask({ projectId, data })).unwrap(),
    editTask: (id, changes) => dispatch(updateTask({ id, changes })).unwrap(),
    removeTask: (id) => dispatch(deleteTask(id)).unwrap(),
    addFiles: (id, files) => dispatch(uploadAttachments({ id, files })).unwrap(),
    removeFile: (id, attachmentId) => dispatch(deleteAttachment({ id, attachmentId })).unwrap(),
  }
}

// one task for the side panel; fetches it if it isn't in the store yet (opened from a link)
export function useTask(id) {
  const dispatch = useAppDispatch()
  const task = useAppSelector((s) => tasksSelectors.selectById(s, id))

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
    toggleDone: (task) =>
      dispatch(updateTask({ id: task._id, changes: { status: task.status === 'done' ? 'todo' : 'done' } })).unwrap(),
  }
}
