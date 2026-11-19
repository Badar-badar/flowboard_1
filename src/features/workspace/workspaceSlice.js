import { createSlice } from '@reduxjs/toolkit'
import { fetchWorkspaces, createWorkspace } from './workspaceThunks'
import { logoutUser } from '../auth/authThunks'

const STORAGE_KEY = 'activeWorkspaceId'
const saved = () => {
  try { return localStorage.getItem(STORAGE_KEY) } catch { return null }
}
const persist = (id) => {
  try { id ? localStorage.setItem(STORAGE_KEY, id) : localStorage.removeItem(STORAGE_KEY) } catch {}
}

const initialState = {
  items: [],
  activeId: saved(),
  loaded: false, // NEW: false until the first fetch finishes
  loading: false,
  creating: false,
  error: null,
}

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setActiveWorkspace(state, { payload }) {
      state.activeId = payload
      persist(payload)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaces.pending, (s) => { s.loading = true })
      .addCase(fetchWorkspaces.fulfilled, (s, { payload }) => {
        s.loading = false
        s.loaded = true
        s.items = payload
        if (!payload.some((w) => w._id === s.activeId)) {
          s.activeId = payload[0]?._id ?? null
          persist(s.activeId)
        }
      })
      .addCase(fetchWorkspaces.rejected, (s, { payload }) => {
        s.loading = false
        s.loaded = true
        s.error = payload
      })
      .addCase(createWorkspace.pending, (s) => { s.creating = true; s.error = null })
      .addCase(createWorkspace.fulfilled, (s, { payload }) => {
        s.creating = false
        s.items.push(payload)
        s.activeId = payload._id
        persist(payload._id)
      })
      .addCase(createWorkspace.rejected, (s, { payload }) => { s.creating = false; s.error = payload })

      // reset everything on logout so the next user starts clean
      .addCase(logoutUser.fulfilled, () => {
        persist(null)
        return { ...initialState, activeId: null }
      })
  },
})

export const { setActiveWorkspace } = workspaceSlice.actions
export default workspaceSlice.reducer