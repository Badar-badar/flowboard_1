import { createSlice } from '@reduxjs/toolkit'
import { fetchMembers } from './membersThunks'
import { setActiveWorkspace } from '../workspace/workspaceSlice'
import { logoutUser } from '../auth/authThunks'

const initialState = { byProject: {} }

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