import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMembers } from './membersThunks'
import { useAuth } from '../auth/useAuth'

const EMPTY = []

export function useProjectMembers(projectId) {
  const dispatch = useDispatch()
  const { user } = useAuth()
  const stored = useSelector((s) => s.members.byProject[projectId])

  useEffect(() => {
    if (projectId && stored === undefined) dispatch(fetchMembers(projectId))
  }, [dispatch, projectId, stored])

  const members = stored ?? EMPTY
  // the Redux user is the Firebase user, so match "me" by email to get the Mongo _id
  const me = members.find((m) => m.email?.toLowerCase() === user?.email?.toLowerCase()) ?? null

  return { members, me, meId: me?._id ?? null, loaded: stored !== undefined }
}