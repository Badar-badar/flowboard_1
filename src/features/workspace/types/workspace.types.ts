export namespace IWorkspace {
  export interface Workspace {
    _id: string
    name: string
    ownerId?: string | Member
    owner?: Member
    ownerName?: string
    ownerEmail?: string
    createdAt?: string
    created_at?: string
  }
  export interface Member { _id?: string; uid?: string; userId?: string; name?: string; displayName?: string; email?: string; photoURL?: string }
  export interface CreatePayload { name: string }
}
