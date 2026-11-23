import { createAsyncThunk } from '@reduxjs/toolkit'

export const createApiThunk = <Arg, Returned>(type: string, fn: (arg: Arg) => Promise<Returned>) =>
  createAsyncThunk<Returned, Arg, { rejectValue: string }>(type, async (arg, { rejectWithValue }) => {
    try {
      return await fn(arg)
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
          ? err.message
          : 'Something went wrong'
      return rejectWithValue(message)
    }
  })
