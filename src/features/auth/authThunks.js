import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { authErrorMessage } from '../../lib/authErrors'
import { authApi } from '../../api/authApi'

let authReadyPromise

export const initAuth = createAsyncThunk('auth/init', async () => {
  authReadyPromise ??= auth.authStateReady()
  await authReadyPromise
  return toPlainUser(auth.currentUser)
})
export const toPlainUser = (u) =>
  u ? { uid: u.uid, email: u.email, displayName: u.displayName } : null

const syncAndFetchUser = async (firebaseUser, profile = {}) => {
  const idToken = await firebaseUser.getIdToken()
  const displayName = profile.displayName ?? firebaseUser.displayName ?? ''

  await authApi.syncUser({ name: displayName }, idToken)
  const response = await authApi.getMe(idToken)
  const backendUser = response?.user ?? response?.data?.user ?? response?.data ?? response

  if (backendUser && typeof backendUser === 'object') {
    return {
      ...backendUser,
      uid: backendUser.uid ?? backendUser.firebaseUid ?? firebaseUser.uid,
      email: backendUser.email ?? firebaseUser.email,
      displayName: backendUser.displayName ?? backendUser.name ?? displayName,
    }
  }

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName,
    photoURL: firebaseUser.photoURL ?? '',
  }
}

export const signupUser = createAsyncThunk(
  'auth/signup',
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(cred.user, { displayName: name })
      return await syncAndFetchUser(cred.user, { displayName: name })
    } catch (err) {
      if (auth.currentUser) await signOut(auth)
      return rejectWithValue(err?.status ? `Backend error (${err.status}): ${err.message}` : authErrorMessage(err))
    }
  }
)

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      return await syncAndFetchUser(cred.user)
    } catch (err) {
      if (auth.currentUser) await signOut(auth)
      return rejectWithValue(err?.status ? `Backend error (${err.status}): ${err.message}` : authErrorMessage(err))
    }
  }
)

export const loginWithGoogle = createAsyncThunk(
  'auth/googleLogin',
  async (_, { rejectWithValue }) => {
    try {
      const provider = new GoogleAuthProvider()
      const cred = await signInWithPopup(auth, provider)
      return await syncAndFetchUser(cred.user)
    } catch (err) {
      if (auth.currentUser) await signOut(auth)
      return rejectWithValue(err?.status ? `Backend error (${err.status}): ${err.message}` : authErrorMessage(err))
    }
  }
)

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await signOut(auth)
    } catch (err) {
      return rejectWithValue(authErrorMessage(err))
    }
  }
)
