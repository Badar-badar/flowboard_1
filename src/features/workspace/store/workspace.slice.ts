import { createSlice } from '@reduxjs/toolkit'
import { fetchWorkspaces, createWorkspace } from './workspace.thunks'
import { logoutUser } from '../../auth/store/auth.thunks'
import type { IWorkspace } from '../types/workspace.types'

interface WorkspaceState {
  items: IWorkspace.Workspace[]
  activeId: string | null
  loaded: boolean
  loading: boolean
  creating: boolean
  error: string | null
}

const initialState: WorkspaceState = {
  items: [],
  activeId: null,
  loaded: false, // NEW: false until the first fetch finishes
  loading: false,
  creating: false,
  error: null,
}

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setActiveWorkspace(state, { payload }: { payload: string | null }) {
      state.activeId = payload
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaces.pending, (s) => { s.loading = true; s.error = null })
      .addCase(fetchWorkspaces.fulfilled, (s, { payload }) => {
        s.loading = false
        s.loaded = true
        s.items = Array.isArray(payload) ? payload : []
        if (!s.items.some((w) => w._id === s.activeId)) {
          s.activeId = s.items[0]?._id ?? null
        }
      })
      .addCase(fetchWorkspaces.rejected, (s, { payload }) => {
        s.loading = false
        s.loaded = false
        s.error = payload ?? 'Could not load workspaces'
      })
      .addCase(createWorkspace.pending, (s) => { s.creating = true; s.error = null })
      .addCase(createWorkspace.fulfilled, (s, { payload }) => {
        s.creating = false
        s.items.push(payload)
        s.activeId = payload._id
      })
      .addCase(createWorkspace.rejected, (s, { payload }) => { s.creating = false; s.error = payload ?? 'Could not create workspace' })

      // reset everything on logout so the next user starts clean
      .addCase(logoutUser.fulfilled, () => {
        return { ...initialState, activeId: null }
      })
  },
})

export const { setActiveWorkspace } = workspaceSlice.actions
export default workspaceSlice.reducer
