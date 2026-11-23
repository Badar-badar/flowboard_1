import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown, Link2, LoaderCircle, LockKeyhole, MailPlus, Settings2, UserMinus, X } from 'lucide-react'
import { membersApi } from '../api/members.api'
import Avatar from '../../../components/ui/avatar'
import { workspaceApi } from '../../workspace/api/workspace.api'
import EmailSuggestionInput from './email-suggestion-input'
import { useProjectMembers } from '../hooks/use-project-members'
import { useWorkspace } from '../../workspace/hooks/use-workspace'

const ROLES = ['admin', 'editor', 'commenter', 'viewer']

export default function InviteMembersModal({ scope, projectId, projectName = 'project', workspaceId, onClose }) {
  const { activeWorkspace } = useWorkspace()
  const { members: projectMembers } = useProjectMembers(projectId)
  const targetWorkspaceId = workspaceId ?? activeWorkspace?._id
  const [workspaceMembers, setWorkspaceMembers] = useState([])
  const [pending, setPending] = useState([])
  const [activeMembers, setActiveMembers] = useState([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('editor')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [accessOpen, setAccessOpen] = useState(false)
  const [accessLevel, setAccessLevel] = useState('private')
  const [copied, setCopied] = useState(false)

  const candidates = useMemo(() => {
    const all = [...workspaceMembers, ...activeMembers]
    return [...new Map(all.filter((member) => member.email).map((member) => [member.email.toLowerCase(), { ...member, name: member.name ?? member.displayName }])).values()]
  }, [workspaceMembers, activeMembers])

  useEffect(() => { setActiveMembers(projectMembers) }, [projectMembers])

  const refresh = async () => {
    setLoading(true)
    try {
      const requests = []
      if (targetWorkspaceId) requests.push(workspaceApi.getMembers(targetWorkspaceId).then((response) => setWorkspaceMembers(response.data ?? [])))
      if (scope === 'project' && projectId) {
        requests.push(membersApi.getByProject(projectId).then((response) => setActiveMembers(response.data ?? [])))
        requests.push(membersApi.getProjectInvitations(projectId).then((response) => setPending(response.data ?? [])))
      }
      await Promise.all(requests)
    } catch {
      // Suggestions are optional; the email field still accepts a new address.
    } finally { setLoading(false) }
  }

  useEffect(() => { refresh() }, [projectId, targetWorkspaceId, scope])
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape' && !busy) onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, busy])

  const invite = async (event) => {
    event.preventDefault()
    const cleanEmail = email.trim().toLowerCase()
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) { setError('Enter a valid email address'); return }
    setBusy(true); setError(''); setNotice('')
    try {
      if (scope === 'project') {
        const result = await membersApi.addToProject(projectId, { email: cleanEmail, role })
        setNotice(result.invited ? `Invitation sent to ${cleanEmail}` : `${cleanEmail} added to the project`)
      } else {
        await workspaceApi.addMember(targetWorkspaceId, cleanEmail)
        setNotice(`${cleanEmail} added to the workspace`)
      }
      setEmail('')
      await refresh()
    } catch (requestError) {
      setError(typeof requestError === 'string' ? requestError : requestError?.message ?? 'Could not add this member')
    } finally { setBusy(false) }
  }

  const revoke = async (invitationId) => {
    try {
      await membersApi.revokeProjectInvitation(projectId, invitationId)
      setPending((current) => current.filter((invitation) => invitation._id !== invitationId))
    } catch (requestError) { setError(requestError?.message ?? 'Could not revoke invitation') }
  }

  const changeMemberRole = async (member, nextRole) => {
    try {
      await membersApi.updateProjectRole(projectId, member._id, nextRole)
      await refresh()
    } catch (requestError) { setError(requestError?.message ?? 'Could not update member role') }
  }

  const removeMember = async (member) => {
    if (!window.confirm(`Remove ${member.name ?? member.email} from this project?`)) return
    try {
      await membersApi.removeFromProject(projectId, member._id)
      await refresh()
    } catch (requestError) { setError(requestError?.message ?? 'Could not remove project member') }
  }

  const copyProjectLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/projects/${projectId}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch { setError('Could not copy project link') }
  }

  if (scope === 'project') return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 px-3 py-5" onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="invite-title" className="flex max-h-[calc(100dvh-2rem)] w-full max-w-[680px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1e1f21] text-slate-100 shadow-2xl">
        <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/10 px-7">
          <h2 id="invite-title" className="truncate text-xl font-semibold">Share {projectName}</h2>
          <div className="flex items-center gap-3"><button type="button" aria-label="Access settings" onClick={() => setAccessOpen((value) => !value)} className={`rounded p-1.5 ${accessOpen ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Settings2 className="h-5 w-5" /></button><button type="button" disabled={busy} onClick={onClose} aria-label="Close" className="rounded p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"><X className="h-5 w-5" /></button></div>
        </header>

        <div className="asana-scroll min-h-0 flex-1 overflow-y-auto">
          <section className="border-b border-white/10 px-7 py-7">
            <h3 className="mb-3 text-base font-semibold">Invite with email</h3>
            <form onSubmit={invite} className="flex flex-wrap items-stretch gap-2.5">
              <div className="min-w-[240px] flex-1"><EmailSuggestionInput value={email} onChange={(value) => { setEmail(value); setError(''); setNotice('') }} candidates={candidates} label={null} placeholder="Add members by name or email" /></div>
              <label className="flex h-11 min-w-36 shrink-0 items-center justify-between gap-2 rounded-lg border border-white/15 bg-[#1e1f21] px-3 text-sm text-slate-300"><select value={role} onChange={(event) => setRole(event.target.value)} aria-label="Invitee project role" className="w-full cursor-pointer appearance-none bg-transparent outline-none">{ROLES.map((item) => <option key={item} value={item} className="bg-[#252628]">{item[0].toUpperCase() + item.slice(1)}</option>)}</select><ChevronDown className="pointer-events-none h-4 w-4 shrink-0 text-slate-400" /></label>
              <button type="submit" disabled={busy || loading || !email.trim()} className="h-11 rounded-lg border border-white/15 px-4 text-sm font-medium text-slate-100 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Invite'}</button>
            </form>
            {error && <p role="alert" className="mt-2 text-sm text-rose-400">{error}</p>}{notice && <p role="status" className="mt-2 text-sm text-emerald-400">{notice}</p>}
          </section>

          <section className="border-b border-white/10 px-7 py-6">
            <h3 className="mb-3 text-base font-semibold">Access settings</h3>
            <button type="button" onClick={() => setAccessOpen((value) => !value)} aria-expanded={accessOpen} className="flex h-[54px] w-full items-center gap-3 rounded-lg border border-white/20 px-4 text-left hover:bg-white/[0.03]"><LockKeyhole className="h-5 w-5 text-slate-300" /><span className="flex-1 text-sm">{accessLevel === 'private' ? 'Private' : activeWorkspace?.name ?? 'My workspace'}</span><ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${accessOpen ? 'rotate-180' : ''}`} /></button>
            {accessOpen && <div className="mt-1 overflow-hidden rounded-lg border border-white/10 bg-[#252628]">
              <button type="button" onClick={() => { setAccessLevel('private'); setAccessOpen(false) }} className="flex w-full items-start gap-3 border-b border-white/10 px-4 py-3 text-left hover:bg-white/[0.035]"><LockKeyhole className="mt-0.5 h-4 w-4 text-slate-300" /><div className="flex-1"><p className="text-sm font-medium">Private</p><p className="mt-1 text-xs text-slate-400">Only project members can find and access this project.</p></div>{accessLevel === 'private' && <Check className="h-4 w-4 text-slate-400" />}</button>
              <button type="button" disabled title="Workspace-wide project access is not supported by the backend" className="flex w-full cursor-not-allowed items-start gap-3 px-4 py-3 text-left opacity-50"><span className="mt-0.5 text-slate-400">♧</span><div><p className="text-sm font-medium">{activeWorkspace?.name ?? 'My workspace'}</p><p className="mt-1 text-xs text-slate-400">Workspace-wide access is not supported by this project API.</p></div></button>
            </div>}
          </section>

          <section className="px-7 py-5">
            <div className="mb-2 flex items-center justify-between"><h3 className="text-base font-semibold">Members</h3><span className="text-xs text-slate-500">{activeMembers.length} {activeMembers.length === 1 ? 'person' : 'people'}</span></div>
            {loading ? <p className="py-4 text-sm text-slate-500">Loading members...</p> : <ul className="divide-y divide-white/5">{activeMembers.map((member) => <li key={member._id} className="flex min-h-[66px] items-center gap-3 py-2"><Avatar name={member.name ?? member.email ?? ''} className="h-9 w-9" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{member.name ?? member.email}</p><p className="truncate text-xs text-slate-400">{member.email}</p></div><select value={member.role ?? 'editor'} aria-label={`Role for ${member.email}`} onChange={(event) => changeMemberRole(member, event.target.value)} className="max-w-32 cursor-pointer bg-transparent text-right text-xs text-slate-300 outline-none"><option value="admin" className="bg-[#252628]">Project admin</option><option value="editor" className="bg-[#252628]">Editor</option><option value="commenter" className="bg-[#252628]">Commenter</option><option value="viewer" className="bg-[#252628]">Viewer</option></select><button type="button" onClick={() => removeMember(member)} aria-label={`Remove ${member.email}`} className="rounded p-1.5 text-slate-500 hover:bg-white/5 hover:text-rose-300"><UserMinus className="h-4 w-4" /></button></li>)}</ul>}
            {pending.length > 0 && <div className="mt-4 border-t border-white/10 pt-3"><h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Pending invitations</h4><ul className="divide-y divide-white/5">{pending.map((invitation) => <li key={invitation._id} className="flex min-h-12 items-center gap-3"><span className="min-w-0 flex-1 truncate text-sm text-slate-300">{invitation.email}</span><select value={invitation.role} aria-label={`Role for invitation to ${invitation.email}`} onChange={async (event) => { try { await membersApi.updateProjectInvitationRole(projectId, invitation._id, event.target.value); setPending((current) => current.map((item) => item._id === invitation._id ? { ...item, role: event.target.value } : item)) } catch (requestError) { setError(requestError?.message ?? 'Could not update invitation') } }} className="bg-transparent text-xs capitalize text-slate-400 outline-none">{ROLES.map((item) => <option key={item} value={item} className="bg-[#252628]">{item}</option>)}</select><button type="button" onClick={() => revoke(invitation._id)} className="rounded px-2 py-1 text-xs text-slate-400 hover:bg-white/5 hover:text-rose-300">Revoke</button></li>)}</ul></div>}
          </section>
        </div>

        <footer className="flex shrink-0 justify-end border-t border-white/10 px-7 py-4"><button type="button" onClick={copyProjectLink} className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/15 px-3.5 text-sm text-slate-100 hover:bg-white/5">{copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Link2 className="h-4 w-4 text-slate-400" />}{copied ? 'Copied project link' : 'Copy project link'}</button></footer>
      </section>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 px-4 py-6" onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="invite-title" className="max-h-full w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#252628] p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div><h2 id="invite-title" className="text-lg font-semibold text-white">{scope === 'project' ? 'Invite to project' : 'Add workspace members'}</h2><p className="mt-1 text-sm text-slate-400">{scope === 'project' ? 'Invite someone by email and choose their project role.' : 'Add an existing Task Desk member by email.'}</p></div>
          <button type="button" disabled={busy} onClick={onClose} aria-label="Close" className="rounded p-1 text-slate-400 hover:bg-white/5 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={invite}>
          <EmailSuggestionInput value={email} onChange={(value) => { setEmail(value); setError(''); setNotice('') }} candidates={candidates} />
          {scope === 'project' && <label className="mt-4 block text-sm text-slate-400">Project role<select value={role} onChange={(event) => setRole(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-white/15 bg-[#1e1f21] px-3 text-sm text-white outline-none focus:border-white/40">{ROLES.map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}</select></label>}
          {error && <p role="alert" className="mt-3 text-sm text-rose-400">{error}</p>}
          {notice && <p role="status" className="mt-3 text-sm text-emerald-400">{notice}</p>}
          <button type="submit" disabled={busy || loading || !targetWorkspaceId && scope === 'workspace'} className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 text-sm font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <MailPlus className="h-4 w-4" />}{busy ? 'Adding...' : scope === 'project' ? 'Invite' : 'Add member'}
          </button>
        </form>

        {scope === 'project' && <div className="mt-6 border-t border-white/10 pt-4">
          <h3 className="text-sm font-medium text-slate-200">Pending invitations</h3>
          {loading ? <p className="mt-3 text-sm text-slate-500">Loading...</p> : pending.length ? <ul className="mt-2 divide-y divide-white/5">{pending.map((invitation) => <li key={invitation._id} className="flex items-center gap-2 py-2.5"><span className="min-w-0 flex-1 truncate text-sm text-slate-300">{invitation.email}</span><span className="text-xs capitalize text-slate-500">{invitation.role}</span><button type="button" onClick={() => revoke(invitation._id)} className="rounded px-2 py-1 text-xs text-slate-400 hover:bg-white/5 hover:text-rose-300">Revoke</button></li>)}</ul> : <p className="mt-2 text-sm text-slate-500">No pending invitations.</p>}
        </div>}
      </section>
    </div>
  )
}
