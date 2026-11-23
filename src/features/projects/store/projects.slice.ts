import { createSlice, createEntityAdapter } from '@reduxjs/toolkit'
import { fetchProjects, fetchProject, createProject, updateProject, deleteProject, toggleProjectFavorite } from './projects.thunks'
import { setActiveWorkspace } from '../../workspace/store/workspace.slice'
import { logoutUser } from '../../auth/store/auth.thunks'
import type { IProjects } from '../types/projects.types'
import type { RootState } from '../../../app/store'

const adapter = createEntityAdapter<IProjects.Project, string>({ selectId: (project) => project._id })

interface ProjectsState {
  workspaceId: string | null
  loaded: boolean
  loading: boolean
  creating: boolean
  error: string | null
}

const initialState = adapter.getInitialState<ProjectsState>({
  workspaceId: null,
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
      .addCase(fetchProjects.pending, (s, { meta }) => {
        s.loading = true
        s.error = null
        s.workspaceId = meta.arg
      })
      .addCase(fetchProjects.fulfilled, (s, { payload, meta }) => {
        if (s.workspaceId !== meta.arg) return
        s.loading = false
        s.loaded = true
        adapter.setAll(s, payload)
      })
      .addCase(fetchProjects.rejected, (s, { payload, meta }) => {
        if (s.workspaceId !== meta.arg) return
        s.loading = false
        s.loaded = true
        s.error = payload ?? 'Could not load projects'
      })

      // merge so list-only fields (members preview) are kept
      .addCase(fetchProject.fulfilled, (s, { payload }) => { adapter.upsertOne(s, payload) })

      .addCase(createProject.pending, (s) => { s.creating = true; s.error = null })
      .addCase(createProject.fulfilled, (s, { payload }) => {
        s.creating = false
        adapter.addOne(s, { taskStats: { total: 0, done: 0 }, members: [], memberCount: 1, isFavorite: false, ...payload })
      })
      .addCase(createProject.rejected, (s, { payload }) => { s.creating = false; s.error = payload ?? 'Could not create project' })

      // PATCH returns the project without role/taskStats, so merge instead of replace
      .addCase(updateProject.fulfilled, (s, { payload }) => {
        adapter.updateOne(s, { id: payload._id, changes: payload })
      })
      .addCase(toggleProjectFavorite.fulfilled, (s, { payload }) => {
        adapter.updateOne(s, { id: payload.id, changes: { isFavorite: payload.isFavorite } })
      })
      .addCase(deleteProject.fulfilled, (s, { payload }) => { adapter.removeOne(s, payload) })

      // projects belong to a workspace: clear on switch and logout
      .addCase(setActiveWorkspace, (_s, { payload }) => ({ ...initialState, workspaceId: payload }))
      .addCase(logoutUser.fulfilled, () => initialState)
  },
})

export const projectsSelectors = adapter.getSelectors((state: RootState) => state.projects)
export default projectsSlice.reducer
