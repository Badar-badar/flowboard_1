export namespace ITasks {
  export type Status = 'todo' | 'in_progress' | 'done'
  export type Priority = 'low' | 'medium' | 'high' | 'urgent'
  export interface Attachment { _id: string; fileName: string; mimeType: string; url: string; size: number }
  export interface Task {
    _id: string
    projectId: string
    projectIds?: string[]
    dependencies?: string[]
    title: string
    description?: string | null
    status: Status | string
    priority?: Priority
    assigneeId?: string | null
    createdBy?: string | { _id?: string; uid?: string; userId?: string; name?: string; displayName?: string; email?: string }
    createdById?: string
    creator?: string | { _id?: string; uid?: string; userId?: string; name?: string; displayName?: string; email?: string }
    dueDate?: string | null
    createdAt?: string
    created_at?: string
    attachments?: Attachment[]
  }
  export interface UpdatePayload extends Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'assigneeId' | 'dueDate' | 'dependencies'>> { }
  export interface CreatePayload extends UpdatePayload { title: string; files?: File[] }
  export interface ListResponse { data: Task[] }
  export interface ItemResponse { data: Task }
}
