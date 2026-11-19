import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { loginUser, signupUser, loginWithGoogle, logoutUser, initAuth } from './authThunks'
import { clearAuthError } from './authSlice'
import { fetchWorkspaces } from '../workspace/workspaceThunks'
export function useAuth() {
  const dispatch = useDispatch()
  const { user, initializing, submitting, error } = useSelector((s) => s.auth)

  useEffect(() => {
    dispatch(initAuth())
  }, [dispatch])

  useEffect(() => {
    if (user) dispatch(fetchWorkspaces())
  }, [user, dispatch])

  return {
    user,
    loading: initializing,
    submitting,
    error,
    login: (data) => dispatch(loginUser(data)).unwrap(),
    loginWithGoogle: () => dispatch(loginWithGoogle()).unwrap(),
    signup: (data) => dispatch(signupUser(data)).unwrap(),
    logout: () => dispatch(logoutUser()),
    clearError: () => dispatch(clearAuthError()),
  }
}
