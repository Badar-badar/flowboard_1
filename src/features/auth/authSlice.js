import { createSlice } from '@reduxjs/toolkit'
import { signupUser, loginUser, loginWithGoogle, logoutUser, initAuth } from './authThunks'

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, initializing: true, initStarted: false, submitting: false, error: null },
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
      .addCase(logoutUser.rejected, (s, { payload }) => { s.submitting = false; s.error = payload })
      .addCase(signupUser.pending, (s) => { s.submitting = true; s.error = null })
      .addCase(signupUser.fulfilled, (s, { payload }) => { s.submitting = false; s.user = payload })
      .addCase(signupUser.rejected, (s, { payload }) => { s.submitting = false; s.error = payload })
      .addCase(loginUser.pending, (s) => { s.submitting = true; s.error = null })
      .addCase(loginUser.fulfilled, (s, { payload }) => { s.submitting = false; s.user = payload })
      .addCase(loginUser.rejected, (s, { payload }) => { s.submitting = false; s.error = payload })
      .addCase(loginWithGoogle.pending, (s) => { s.submitting = true; s.error = null })
      .addCase(loginWithGoogle.fulfilled, (s, { payload }) => { s.submitting = false; s.user = payload })
      .addCase(loginWithGoogle.rejected, (s, { payload }) => { s.submitting = false; s.error = payload })
  },
})

export const { clearAuthError } = authSlice.actions
export default authSlice.reducer
