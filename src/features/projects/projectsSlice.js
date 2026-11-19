import { createSlice, createEntityAdapter } from '@reduxjs/toolkit'
import { fetchProjects, fetchProject, createProject, updateProject, deleteProject } from './projectsThunks'
import { setActiveWorkspace } from '../workspace/workspaceSlice'
import { logoutUser } from '../auth/authThunks'

const adapter = createEntityAdapter({ selectId: (p) => p._id })

const initialState = adapter.getInitialState({
  loaded: false,
  loading: false,
  creating: false,
  error: null,
})

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (s) => { s.loading = true; s.error = null })
      .addCase(fetchProjects.fulfilled, (s, { payload }) => {
        s.loading = false
        s.loaded = true
        adapter.setAll(s, payload)
      })
      .addCase(fetchProjects.rejected, (s, { payload }) => { s.loading = false; s.loaded = true; s.error = payload })

      // merge so list-only fields (members preview) are kept
      .addCase(fetchProject.fulfilled, (s, { payload }) => { adapter.upsertOne(s, payload) })

      .addCase(createProject.pending, (s) => { s.creating = true; s.error = null })
      .addCase(createProject.fulfilled, (s, { payload }) => {
        s.creating = false
        adapter.addOne(s, { taskStats: { total: 0, done: 0 }, members: [], memberCount: 1, isFavorite: false, ...payload })
      })
      .addCase(createProject.rejected, (s, { payload }) => { s.creating = false; s.error = payload })

      // PATCH returns the project without role/taskStats, so merge instead of replace
      .addCase(updateProject.fulfilled, (s, { payload }) => {
        adapter.updateOne(s, { id: payload._id, changes: payload })
      })
      .addCase(deleteProject.fulfilled, (s, { payload }) => { adapter.removeOne(s, payload) })

      // projects belong to a workspace: clear on switch and logout
      .addCase(setActiveWorkspace, () => initialState)
      .addCase(logoutUser.fulfilled, () => initialState)
  },
})

export const projectsSelectors = adapter.getSelectors((state) => state.projects)
export default projectsSlice.reducer