export namespace IMembers {
  export interface Member { uid?: string; userId?: string; _id?: string; name?: string; email?: string; photoURL?: string; role?: string }
  export interface Invitation { _id: string; email: string; role: string; status?: string; invitedBy?: Member; createdAt?: string }
  export interface ListResponse { data: Member[] }
}
