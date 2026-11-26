import { createSlice, createEntityAdapter, createSelector } from '@reduxjs/toolkit'
import {
  fetchProjectTasks, fetchMyTasks, fetchTask, createTask,
  updateTask, deleteTask, uploadAttachments, deleteAttachment,
} from './tasks.thunks'
import { setActiveWorkspace } from '../../workspace/store/workspace.slice'
import { logoutUser } from '../../auth/store/auth.thunks'
import type { ITasks } from '../types/tasks.types'
import type { RootState } from '../../../app/store'

const adapter = createEntityAdapter<ITasks.Task, string>({
  selectId: (task) => task._id,
  sortComparer: (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)), // newest first
})

interface TasksState {
  loadedProjects: Record<string, boolean>
  loadingProjects: Record<string, boolean>
  myIds: string[]
  myLoaded: boolean
  myRequestId: string | null
  pendingCreates: Record<string, string>
  backups: Record<string, Partial<ITasks.Task>>
  error: string | null
}

const initialState = adapter.getInitialState<TasksState>({
  loadedProjects: {},  // projectId -> true after the first fetch
  loadingProjects: {},
  myIds: [],
  myLoaded: false,
  myRequestId: null,
  pendingCreates: {},
  backups: {},         // requestId -> previous values, for optimistic rollback
  error: null,
})

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearTasksError(s) { s.error = null },
    removeTaskFromStore(s, { payload }: { payload: string }) {
      adapter.removeOne(s, payload)
      s.myIds = s.myIds.filter((id) => id !== payload)
    },
    includeCreatedTaskInMyTasks(s, { payload }: { payload: ITasks.Task }) {
      adapter.upsertOne(s, payload)
      if (!s.myIds.includes(payload._id)) s.myIds.unshift(payload._id)
      s.myLoaded = true
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjectTasks.fulfilled, (s, { payload, meta }) => {
        const projectId = meta.arg
        s.loadingProjects[projectId] = false
        const fresh = new Set(payload.map((t) => t._id))
        // remove tasks of this project that no longer exist on the server
        const pendingIds = new Set(Object.values(s.pendingCreates))
        const stale = s.ids.filter((id) => s.entities[id].projectId === projectId && !fresh.has(id) && !pendingIds.has(id))
        adapter.removeMany(s, stale)
        adapter.upsertMany(s, payload)
        s.loadedProjects[projectId] = true
      })
      .addCase(fetchProjectTasks.rejected, (s, { payload, meta }) => {
        s.loadingProjects[meta.arg] = false
        s.loadedProjects[meta.arg] = true
        s.error = payload
      })
      .addCase(fetchProjectTasks.pending, (s, { meta }) => { s.loadingProjects[meta.arg] = true })

      .addCase(fetchMyTasks.pending, (s, { meta }) => {
        s.myRequestId = meta.requestId
      })
      .addCase(fetchMyTasks.fulfilled, (s, { payload, meta }) => {
        if (s.myRequestId !== meta.requestId) return
        s.myRequestId = null
        adapter.upsertMany(s, payload)
        s.myIds = payload.map((t) => t._id)
        s.myLoaded = true
      })
      .addCase(fetchMyTasks.rejected, (s, { payload, meta }) => {
        if (s.myRequestId !== meta.requestId) return
        s.myRequestId = null
        s.myLoaded = true
        s.error = payload
      })

      .addCase(fetchTask.fulfilled, (s, { payload }) => { adapter.upsertOne(s, payload) })

      .addCase(createTask.pending, (s, { meta }) => {
        const temporaryId = `pending-${meta.requestId}`
        s.pendingCreates[meta.requestId] = temporaryId
        adapter.addOne(s, {
          _id: temporaryId,
          projectId: meta.arg.projectId,
          title: meta.arg.data.title,
          status: meta.arg.data.status ?? 'todo',
          priority: meta.arg.data.priority ?? 'medium',
          assigneeId: meta.arg.data.assigneeId ?? null,
          dueDate: meta.arg.data.dueDate ?? null,
          attachments: [],
          createdAt: new Date().toISOString(),
        })
      })
      .addCase(createTask.fulfilled, (s, { payload, meta }) => {
        const temporaryId = s.pendingCreates[meta.requestId]
        if (temporaryId) adapter.removeOne(s, temporaryId)
        delete s.pendingCreates[meta.requestId]
        adapter.upsertOne(s, payload)
      })
      .addCase(createTask.rejected, (s, { payload, meta }) => {
        const temporaryId = s.pendingCreates[meta.requestId]
        if (temporaryId) adapter.removeOne(s, temporaryId)
        delete s.pendingCreates[meta.requestId]
        s.error = payload
      })

      // optimistic update
      .addCase(updateTask.pending, (s, { meta }) => {
        const { id, changes } = meta.arg
        const task = s.entities[id]
        if (!task) return
        s.backups[meta.requestId] = Object.fromEntries(Object.keys(changes).map((k) => [k, task[k]]))
        Object.assign(task, changes)
      })
      .addCase(updateTask.fulfilled, (s, { payload, meta }) => {
        delete s.backups[meta.requestId]
        adapter.upsertOne(s, payload)
      })
      .addCase(updateTask.rejected, (s, { payload, meta }) => {
        const backup = s.backups[meta.requestId]
        const task = s.entities[meta.arg.id]
        if (backup && task) Object.assign(task, backup)
        delete s.backups[meta.requestId]
        s.error = payload
      })

      .addCase(deleteTask.fulfilled, (s, { payload }) => {
        adapter.removeOne(s, payload)
        s.myIds = s.myIds.filter((id) => id !== payload)
      })
      .addCase(deleteTask.rejected, (s, { payload }) => { s.error = payload })

      .addCase(uploadAttachments.fulfilled, (s, { payload }) => { adapter.upsertOne(s, payload) })
      .addCase(uploadAttachments.rejected, (s, { payload }) => { s.error = payload })
      .addCase(deleteAttachment.fulfilled, (s, { payload }) => { adapter.upsertOne(s, payload) })
      .addCase(deleteAttachment.rejected, (s, { payload }) => { s.error = payload })

      // tasks belong to a workspace
      .addCase(setActiveWorkspace, (_s, { payload }) => ({
        ...initialState,
        // Switching to no workspace is a resolved empty state, not a request
        // that can remain in the loading state forever.
        myLoaded: payload === null,
      }))
      .addCase(logoutUser.fulfilled, () => initialState)
  },
})

export const { clearTasksError, removeTaskFromStore, includeCreatedTaskInMyTasks } = tasksSlice.actions
export const tasksSelectors = adapter.getSelectors((state: RootState) => state.tasks)

export const selectTasksByProject = createSelector(
  [tasksSelectors.selectAll, (_: RootState, projectId: string) => projectId],
  (tasks, projectId) => tasks.filter((t) => t.projectId === projectId),
)

export const selectMyTasks = createSelector(
  [(state: RootState) => tasksSelectors.selectEntities(state), (state: RootState) => state.tasks.myIds],
  (entities, ids) => ids.map((id) => entities[id]).filter(Boolean),
)

export default tasksSlice.reducer
