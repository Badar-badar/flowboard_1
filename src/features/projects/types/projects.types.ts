export namespace IProjects {
  export interface Project {
    _id: string
    name: string
    color?: string
    role?: string
    owner?: IProjects.Member
    createdBy?: IProjects.Member
    ownerId?: string | IProjects.Member
    description?: string
    status?: string
    startDate?: string | null
    dueDate?: string | null
    members?: IProjects.Member[]
    memberCount?: number
    isFavorite?: boolean
    createdAt?: string
    created_at?: string
    updatedAt?: string
    updated_at?: string
    workspaceId?: string
    taskStats?: { total: number; done: number }
  }
  export interface Member { _id?: string; uid?: string; userId?: string; name?: string; displayName?: string; email?: string; photoURL?: string }
  export interface CreatePayload { name: string; color: string; workspaceId: string }
  export type UpdatePayload = Partial<Pick<Project, 'name' | 'color' | 'description' | 'status' | 'startDate' | 'dueDate' | 'isFavorite'>>
  export interface ListResponse { data: Project[] }
  export interface ItemResponse { data: Project }
}
