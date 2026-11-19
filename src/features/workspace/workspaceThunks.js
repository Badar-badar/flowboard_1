import { createAsyncThunk } from '@reduxjs/toolkit'
import { workspaceApi } from '../../api/workspaceApi'

export const fetchWorkspaces = createAsyncThunk(
  'workspace/fetchMine',
  async (_, { rejectWithValue }) => {
    try {
      const res = await workspaceApi.getMine()
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const createWorkspace = createAsyncThunk(
  'workspace/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await workspaceApi.create(data)
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)