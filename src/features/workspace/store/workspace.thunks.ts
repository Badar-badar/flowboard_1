import { createAsyncThunk } from '@reduxjs/toolkit'
import { workspaceApi } from '../api/workspace.api'
import type { IWorkspace } from '../types/workspace.types'

const messageOf = (err: unknown, fallback: string) =>
  err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
    ? err.message
    : fallback

export const fetchWorkspaces = createAsyncThunk<IWorkspace.Workspace[], void, { rejectValue: string }>(
  'workspace/fetchMine',
  async (_, { rejectWithValue }) => {
    try {
      const res = await workspaceApi.getMine()
      const workspaces = Array.isArray(res) ? res : res?.data
      if (!Array.isArray(workspaces)) {
        return rejectWithValue('The server returned an invalid workspace list')
      }
      return workspaces
    } catch (err) {
      return rejectWithValue(messageOf(err, 'Could not load workspaces'))
    }
  }
)

export const createWorkspace = createAsyncThunk<IWorkspace.Workspace, IWorkspace.CreatePayload, { rejectValue: string }>(
  'workspace/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await workspaceApi.create(data)
      return res.data
    } catch (err) {
      return rejectWithValue(messageOf(err, 'Could not create workspace'))
    }
  }
)
