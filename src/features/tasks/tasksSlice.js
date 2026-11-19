import { createSlice, createEntityAdapter, createSelector } from '@reduxjs/toolkit'
import {
  fetchProjectTasks, fetchMyTasks, fetchTask, createTask,
  updateTask, deleteTask, uploadAttachments, deleteAttachment,
} from './tasksThunks'
import { setActiveWorkspace } from '../workspace/workspaceSlice'
import { logoutUser } from '../auth/authThunks'

const adapter = createEntityAdapter({
  selectId: (t) => t._id,
  sortComparer: (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)), // newest first
})

const initialState = adapter.getInitialState({
  loadedProjects: {},  // projectId -> true after the first fetch
  myIds: [],
  myLoaded: false,
  backups: {},         // requestId -> previous values, for optimistic rollback
  error: null,
})

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearTasksError(s) { s.error = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjectTasks.fulfilled, (s, { payload, meta }) => {
        const projectId = meta.arg
        const fresh = new Set(payload.map((t) => t._id))
        // remove tasks of this project that no longer exist on the server
        const stale = s.ids.filter((id) => s.entities[id].projectId === projectId && !fresh.has(id))
        adapter.removeMany(s, stale)
        adapter.upsertMany(s, payload)
        s.loadedProjects[projectId] = true
      })
      .addCase(fetchProjectTasks.rejected, (s, { payload, meta }) => {
        s.loadedProjects[meta.arg] = true
        s.error = payload
      })

      .addCase(fetchMyTasks.fulfilled, (s, { payload }) => {
        adapter.upsertMany(s, payload)
        s.myIds = payload.map((t) => t._id)
        s.myLoaded = true
      })
      .addCase(fetchMyTasks.rejected, (s, { payload }) => { s.myLoaded = true; s.error = payload })

      .addCase(fetchTask.fulfilled, (s, { payload }) => { adapter.upsertOne(s, payload) })

      .addCase(createTask.fulfilled, (s, { payload }) => { adapter.addOne(s, payload) })
      .addCase(createTask.rejected, (s, { payload }) => { s.error = payload })

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
      .addCase(setActiveWorkspace, () => initialState)
      .addCase(logoutUser.fulfilled, () => initialState)
  },
})

export const { clearTasksError } = tasksSlice.actions
export const tasksSelectors = adapter.getSelectors((state) => state.tasks)

export const selectTasksByProject = createSelector(
  [tasksSelectors.selectAll, (_, projectId) => projectId],
  (tasks, projectId) => tasks.filter((t) => t.projectId === projectId),
)

export const selectMyTasks = createSelector(
  [tasksSelectors.selectEntities, (s) => s.tasks.myIds],
  (entities, ids) => ids.map((id) => entities[id]).filter(Boolean),
)

export default tasksSlice.reducer