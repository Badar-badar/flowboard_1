import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { loginUser, signupUser, loginWithGoogle, logoutUser, initAuth } from '../store/auth.thunks'
import { clearAuthError } from '../store/auth.slice'
import type { IAuth } from '../types/auth.types'
export function useAuth() {
  const dispatch = useAppDispatch()
  const { user, initializing, submitting, error } = useAppSelector((s) => s.auth)

  useEffect(() => {
    dispatch(initAuth())
  }, [dispatch])

  return {
    user,
    loading: initializing,
    submitting,
    error,
    login: (data: IAuth.Credentials) => dispatch(loginUser(data)).unwrap(),
    loginWithGoogle: () => dispatch(loginWithGoogle()).unwrap(),
    signup: (data: IAuth.SignupPayload) => dispatch(signupUser(data)).unwrap(),
    logout: () => dispatch(logoutUser()),
    clearError: () => dispatch(clearAuthError()),
  }
}
