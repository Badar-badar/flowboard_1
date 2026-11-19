import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchProjectTasks, fetchMyTasks, fetchTask, createTask,
  updateTask, deleteTask, uploadAttachments, deleteAttachment,
} from './tasksThunks'
import { selectTasksByProject, selectMyTasks, tasksSelectors, clearTasksError } from './tasksSlice'

export function useTasks(projectId) {
  const dispatch = useDispatch()
  const tasks = useSelector((s) => selectTasksByProject(s, projectId))
  const loaded = useSelector((s) => !!s.tasks.loadedProjects[projectId])
  const error = useSelector((s) => s.tasks.error)

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
  const dispatch = useDispatch()
  const task = useSelector((s) => tasksSelectors.selectById(s, id))

  useEffect(() => {
    if (id) dispatch(fetchTask(id))
  }, [dispatch, id])

  return task
}

export function useMyTasks() {
  const dispatch = useDispatch()
  const tasks = useSelector(selectMyTasks)
  const loaded = useSelector((s) => s.tasks.myLoaded)
  const activeId = useSelector((s) => s.workspace.activeId)

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