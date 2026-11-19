import { createApiThunk } from '../createApiThunk'
import { membersApi } from '../../api/membersApi'

export const fetchMembers = createApiThunk('members/fetch', async (projectId) => ({
  projectId,
  members: (await membersApi.getByProject(projectId)).data,
}))