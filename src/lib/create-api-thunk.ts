import { createAsyncThunk } from '@reduxjs/toolkit'

export const createApiThunk = <Arg, Returned>(type: string, fn: (arg: Arg) => Promise<Returned>) =>
  createAsyncThunk<Returned, Arg, { rejectValue: string }>(type, async (arg, { rejectWithValue }) => {
    try {
      return await fn(arg)
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : 'Something went wrong')
    }
  })
