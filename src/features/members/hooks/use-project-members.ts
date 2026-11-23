import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { fetchMembers } from '../store/members.thunks'
import { useAuth } from '../../auth/hooks/use-auth'
import type { IMembers } from '../types/members.types'

const EMPTY: IMembers.Member[] = []

export function useProjectMembers(projectId?: string) {
  const dispatch = useAppDispatch()
  const { user } = useAuth()
  const stored = useAppSelector((s) => projectId ? s.members.byProject[projectId] : undefined)

  useEffect(() => {
    if (projectId && stored === undefined) dispatch(fetchMembers(projectId))
  }, [dispatch, projectId, stored])

  const members = stored ?? EMPTY
  // the Redux user is the Firebase user, so match "me" by email to get the Mongo _id
  const me = members.find((member: IMembers.Member) => member.email?.toLowerCase() === user?.email?.toLowerCase()) ?? null

  return { members, me, meId: me?._id ?? null, loaded: stored !== undefined }
}
