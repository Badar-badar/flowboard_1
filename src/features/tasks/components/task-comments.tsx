import { useEffect, useMemo, useState } from 'react'
import { MessageCircle, MoreHorizontal, Pencil, Send, Trash2, X } from 'lucide-react'
import Avatar from '../../../components/ui/avatar'
import Dropdown from '../../../components/ui/dropdown'
import { useAuth } from '../../auth/hooks/use-auth'
import { useProjectMembers } from '../../members/hooks/use-project-members'
import { commentsApi, type TaskComment } from '../api/comments.api'
import type { FormEvent } from 'react'
import type { IMembers } from '../../members/types/members.types'

const roleCanComment = (role?: string) => ['admin', 'editor', 'commenter'].includes(role ?? '')
const authorObject = (comment: TaskComment) => typeof comment.authorId === 'object' ? comment.authorId : null
const authorName = (comment: TaskComment) => {
  const author = authorObject(comment)
  return author?.name ?? author?.email ?? 'Unknown member'
}
const authorId = (comment: TaskComment) => {
  const author = authorObject(comment)
  return author?._id ?? author?.uid ?? author?.userId ?? (typeof comment.authorId === 'string' ? comment.authorId : null)
}
const timeLabel = (value?: string) => {
  if (!value) return 'Just now'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Just now'
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)
}

const messageOf = (error: unknown, fallback: string) =>
  error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
    ? error.message
    : fallback

export default function TaskComments({ taskId, projectId, role }: { taskId: string; projectId: string; role?: string }) {
  const { user } = useAuth()
  const { members, meId } = useProjectMembers(projectId)
  const [comments, setComments] = useState<TaskComment[]>([])
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const canComment = roleCanComment(role)
  const currentMember = useMemo(() => members.find((member: IMembers.Member) => member._id === meId), [members, meId])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    commentsApi.getByTask(taskId).then((response) => {
      if (active) setComments(response.data ?? [])
    }).catch((requestError) => {
      if (active) setError(requestError?.message ?? 'Could not load comments')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [taskId])

  const isMine = (comment: TaskComment) => {
    const id = authorId(comment)
    const memberUid = currentMember?.uid ?? currentMember?.userId
    return (id && [meId, user?.uid, memberUid].filter(Boolean).map(String).includes(String(id))) || authorObject(comment)?.email?.toLowerCase() === user?.email?.toLowerCase()
  }

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const body = draft.trim()
    if (!body || sending) return
    setSending(true); setError('')
    try {
      const response = await commentsApi.create(taskId, body)
      setComments((current) => [...current, response.data])
      setDraft('')
    } catch (requestError) { setError(messageOf(requestError, 'Could not post comment')) }
    finally { setSending(false) }
  }

  const saveEdit = async (comment: TaskComment) => {
    const body = editDraft.trim()
    if (!body) return
    try {
      const response = await commentsApi.update(comment._id, body)
      setComments((current) => current.map((item) => item._id === comment._id ? response.data : item))
      setEditingId(null); setEditDraft(''); setError('')
    } catch (requestError) { setError(messageOf(requestError, 'Could not update comment')) }
  }

  const remove = async (comment: TaskComment) => {
    if (!window.confirm('Delete this comment?')) return
    try {
      await commentsApi.remove(comment._id)
      setComments((current) => current.filter((item) => item._id !== comment._id))
      setError('')
    } catch (requestError) { setError(messageOf(requestError, 'Could not delete comment')) }
  }

  return (
    <section className="mt-7 border-t border-white/10 pt-5">
      <div className="mb-4 flex items-center gap-2"><MessageCircle className="h-4 w-4 text-slate-400" /><h2 className="text-base font-semibold text-slate-100">Comments</h2><span className="text-xs text-slate-500">{comments.length}</span></div>
      {error && <p role="alert" className="mb-3 rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}
      {loading ? <p className="py-3 text-sm text-slate-500">Loading comments...</p> : comments.length ? <div className="space-y-4">
        {comments.map((comment) => <article key={comment._id} className="group/comment flex gap-3">
          <Avatar name={authorName(comment)} className="h-8 w-8" />
          <div className="min-w-0 flex-1 rounded-lg bg-[#292a2c] px-3 py-2.5">
            <div className="flex items-center gap-2"><span className="truncate text-sm font-medium text-slate-100">{authorName(comment)}</span><time className="shrink-0 text-xs text-slate-500" dateTime={comment.createdAt}>{timeLabel(comment.createdAt)}</time>
              {(role === 'admin' || isMine(comment) && canComment) && <div className="ml-auto opacity-0 transition-opacity group-hover/comment:opacity-100 focus-within:opacity-100"><Dropdown width="w-36" align="right" trigger={({ toggle }) => <button type="button" aria-label="Comment options" onClick={toggle} className="rounded p-1 text-slate-500 hover:bg-white/10 hover:text-white"><MoreHorizontal className="h-4 w-4" /></button>}>
                {({ close }) => <div className="py-1">{isMine(comment) && canComment && <button type="button" onClick={() => { setEditingId(comment._id); setEditDraft(comment.body); close() }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/5"><Pencil className="h-3.5 w-3.5" />Edit</button>}<button type="button" onClick={() => { close(); remove(comment) }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-300 hover:bg-white/5"><Trash2 className="h-3.5 w-3.5" />Delete</button></div>}
              </Dropdown></div>}
            </div>
            {editingId === comment._id ? <div className="mt-2">
              <textarea autoFocus value={editDraft} onChange={(event) => setEditDraft(event.target.value)} maxLength={2000} rows={3} className="w-full resize-y rounded-md border border-white/15 bg-[#1e1f21] p-2 text-sm leading-5 text-slate-100 outline-none focus:border-white/40" />
              <div className="mt-2 flex justify-end gap-2"><button type="button" onClick={() => { setEditingId(null); setEditDraft('') }} className="rounded px-2 py-1 text-xs text-slate-400 hover:bg-white/5"><X className="inline h-3.5 w-3.5" /> Cancel</button><button type="button" onClick={() => saveEdit(comment)} disabled={!editDraft.trim()} className="rounded bg-blue-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-400 disabled:opacity-50">Save</button></div>
            </div> : <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-slate-300">{comment.body}</p>}
          </div>
        </article>)}
      </div> : <p className="mb-4 text-sm text-slate-500">No comments yet. Start the conversation.</p>}

      {canComment && <form onSubmit={create} className="mt-4 flex items-start gap-3">
        <Avatar name={user?.displayName ?? user?.email ?? 'You'} className="h-8 w-8" />
        <div className="min-w-0 flex-1 rounded-lg border border-white/15 bg-[#252628] focus-within:border-white/30">
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={2000} rows={2} placeholder="Write a comment..." className="w-full resize-y bg-transparent px-3 py-2.5 text-sm leading-5 text-slate-100 outline-none placeholder:text-slate-500" onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }} />
          <div className="flex items-center justify-between border-t border-white/5 px-2 py-1.5"><span className="text-[11px] text-slate-500">Ctrl + Enter to send</span><button type="submit" disabled={sending || !draft.trim()} aria-label="Send comment" className="inline-flex items-center gap-1.5 rounded-md bg-blue-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-3.5 w-3.5" />{sending ? 'Sending...' : 'Send'}</button></div>
        </div>
      </form>}
      {!canComment && <p className="mt-4 text-xs text-slate-500">You have view-only access to comments.</p>}
    </section>
  )
}
