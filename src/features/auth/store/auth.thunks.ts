import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../../../configs/firebase.config'
import { authErrorMessage } from '../auth-errors'
import { authApi } from '../api/auth.api'
import type { User } from 'firebase/auth'
import type { IAuth } from '../types/auth.types'

let authReadyPromise

export const initAuth = createAsyncThunk<IAuth.User | null>('auth/init', async () => {
  authReadyPromise ??= auth.authStateReady()
  await authReadyPromise
  return toPlainUser(auth.currentUser)
}, {
  // Multiple components call useAuth(), and Strict Mode mounts effects twice.
  // Share the initialization request so route guards cannot race each other.
  condition: (_, { getState }) => !(getState() as { auth: { initStarted: boolean } }).auth.initStarted,
})
export const toPlainUser = (u: User | null): IAuth.User | null =>
  u ? { uid: u.uid, email: u.email, displayName: u.displayName } : null

const syncAndFetchUser = async (firebaseUser: User, profile: { displayName?: string } = {}): Promise<IAuth.User> => {
  const displayName = profile.displayName ?? firebaseUser.displayName ?? ''

  await authApi.syncUser({ name: displayName })
  const response = await authApi.getMe()
  const responseData = response.data
  let backendUser: IAuth.BackendUser | undefined = response.user
  if (!backendUser && responseData) {
    backendUser = 'user' in responseData ? responseData.user : responseData
  }

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

export const signupUser = createAsyncThunk<IAuth.User, IAuth.SignupPayload, { rejectValue: string }>(
  'auth/signup',
  async ({ name, email, password }: IAuth.SignupPayload, { rejectWithValue }) => {
    let createdUser: User | null = null
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      createdUser = cred.user
      await updateProfile(cred.user, { displayName: name })
      return await syncAndFetchUser(cred.user, { displayName: name })
    } catch (err) {
      if (createdUser) await signOut(auth)
      return rejectWithValue(getAuthFailureMessage(err))
    }
  },
)

export const loginUser = createAsyncThunk<IAuth.User, IAuth.Credentials, { rejectValue: string }>(
  'auth/login',
  async ({ email, password }: IAuth.Credentials, { rejectWithValue }) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      return await syncAndFetchUser(cred.user)
    } catch (err) {
      return rejectWithValue(getAuthFailureMessage(err))
    }
  },
)

export const loginWithGoogle = createAsyncThunk<IAuth.User, void, { rejectValue: string }>(
  'auth/googleLogin',
  async (_, { rejectWithValue }) => {
    try {
      const provider = new GoogleAuthProvider()
      const cred = await signInWithPopup(auth, provider)
      return await syncAndFetchUser(cred.user)
    } catch (err) {
      return rejectWithValue(getAuthFailureMessage(err))
    }
  },
)

export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await signOut(auth)
    } catch (err) {
      return rejectWithValue(authErrorMessage(err))
    }
  },
)

function getAuthFailureMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number') {
    return `Backend error (${error.status}): ${'message' in error && typeof error.message === 'string' ? error.message : 'Request failed'}`
  }
  return authErrorMessage(error)
}
