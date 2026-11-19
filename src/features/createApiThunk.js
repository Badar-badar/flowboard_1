import { createAsyncThunk } from '@reduxjs/toolkit'

export const createApiThunk = (type, fn) =>
  createAsyncThunk(type, async (arg, { rejectWithValue }) => {
    try {
      return await fn(arg)
    } catch (err) {
      return rejectWithValue(err.message || 'Something went wrong')
    }
  })