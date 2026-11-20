export namespace IMembers {
  export interface Member { uid?: string; userId?: string; _id?: string; name?: string; email?: string; photoURL?: string; role?: string }
  export interface ListResponse { data: Member[] }
}
