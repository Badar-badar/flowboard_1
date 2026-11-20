import { createSlice } from '@reduxjs/toolkit'
import { signupUser, loginUser, loginWithGoogle, logoutUser, initAuth } from './auth.thunks'
import type { IAuth } from '../types/auth.types'

interface AuthState {
  user: IAuth.User | null
  initializing: boolean
  initStarted: boolean
  submitting: boolean
  error: string | null
}

const initialState: AuthState = { user: null, initializing: true, initStarted: false, submitting: false, error: null }

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initAuth.pending, (s) => { s.initStarted = true })
      .addCase(initAuth.fulfilled, (s, { payload }) => { s.user = payload; s.initializing = false })
      .addCase(initAuth.rejected, (s) => { s.initializing = false })
      .addCase(logoutUser.pending, (s) => { s.submitting = true; s.error = null })
      .addCase(logoutUser.fulfilled, (s) => { s.user = null; s.submitting = false })
      .addCase(logoutUser.rejected, (s, { payload }) => { s.submitting = false; s.error = payload ?? 'Could not sign out' })
      .addCase(signupUser.pending, (s) => { s.submitting = true; s.error = null })
      .addCase(signupUser.fulfilled, (s, { payload }) => { s.submitting = false; s.user = payload })
      .addCase(signupUser.rejected, (s, { payload }) => { s.submitting = false; s.error = payload ?? 'Could not create account' })
      .addCase(loginUser.pending, (s) => { s.submitting = true; s.error = null })
      .addCase(loginUser.fulfilled, (s, { payload }) => { s.submitting = false; s.user = payload })
      .addCase(loginUser.rejected, (s, { payload }) => { s.submitting = false; s.error = payload ?? 'Could not sign in' })
      .addCase(loginWithGoogle.pending, (s) => { s.submitting = true; s.error = null })
      .addCase(loginWithGoogle.fulfilled, (s, { payload }) => { s.submitting = false; s.user = payload })
      .addCase(loginWithGoogle.rejected, (s, { payload }) => { s.submitting = false; s.error = payload ?? 'Could not sign in with Google' })
  },
})

export const { clearAuthError } = authSlice.actions
export default authSlice.reducer
