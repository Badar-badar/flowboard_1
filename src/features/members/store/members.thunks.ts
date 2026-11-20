import { createApiThunk } from '../../../lib/create-api-thunk'
import { membersApi } from '../api/members.api'
import type { IMembers } from '../types/members.types'

export const fetchMembers = createApiThunk<string, { projectId: string; members: IMembers.Member[] }>('members/fetch', async (projectId) => ({
  projectId,
  members: (await membersApi.getByProject(projectId)).data,
}))
