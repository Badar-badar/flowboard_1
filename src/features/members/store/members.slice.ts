import { createSlice } from '@reduxjs/toolkit'
import { fetchMembers } from './members.thunks'
import { setActiveWorkspace } from '../../workspace/store/workspace.slice'
import { logoutUser } from '../../auth/store/auth.thunks'
import type { IMembers } from '../types/members.types'

const initialState: { byProject: Record<string, IMembers.Member[]> } = { byProject: {} }

const membersSlice = createSlice({
  name: 'members',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMembers.fulfilled, (s, { payload }) => { s.byProject[payload.projectId] = payload.members })
      .addCase(setActiveWorkspace, () => initialState)
      .addCase(logoutUser.fulfilled, () => initialState)
  },
})

export default membersSlice.reducer
