import { useRef, useState } from 'react'
import { FileText, Paperclip, Trash2 } from 'lucide-react'
import { ALLOWED_FILE_TYPES, MAX_FILES, MAX_FILE_SIZE } from '../../lib/taskConstants'

const size = (b) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(b / 1024)} KB`)

export default function AttachmentList({ attachments = [], canEdit, onUpload, onRemove }) {
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const pick = async (e) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length) return
    if (files.length > MAX_FILES) return setError(`You can upload up to ${MAX_FILES} files at once`)
    const bad = files.find((f) => !ALLOWED_FILE_TYPES.includes(f.type) || f.size > MAX_FILE_SIZE)
    if (bad) return setError(`"${bad.name}" must be a JPEG, PNG, WebP or PDF under 10 MB`)

    setError('')
    setBusy(true)
    try { await onUpload(files) } catch (err) { setError(typeof err === 'string' ? err : 'Upload failed') }
    setBusy(false)
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">Attachments</h3>
        {canEdit && (
          <>
            <button disabled={busy} onClick={() => input.current?.click()} className="flex items-center gap-1 text-sm text-slate-300 hover:text-white disabled:opacity-50">
              <Paperclip className="h-4 w-4" /> {busy ? 'Uploading...' : 'Attach'}
            </button>
            <input ref={input} type="file" multiple hidden accept={ALLOWED_FILE_TYPES.join(',')} onChange={pick} />
          </>
        )}
      </div>

      {error && <p className="mb-2 text-sm text-rose-400">{error}</p>}
      {!attachments.length && <p className="text-sm text-slate-500">No attachments</p>}

      <ul className="space-y-2">
        {attachments.map((a) => (
          <li key={a._id} className="flex items-center gap-3 rounded-lg border border-white/10 p-2">
            {a.mimeType.startsWith('image/') ? (
              <img src={a.url} alt="" className="h-10 w-10 rounded object-cover" />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded bg-white/5"><FileText className="h-5 w-5 text-slate-400" /></span>
            )}
            <a href={a.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1">
              <span className="block truncate text-sm text-white hover:underline">{a.fileName}</span>
              <span className="text-xs text-slate-500">{size(a.size)}</span>
            </a>
            {canEdit && (
              <button onClick={() => onRemove(a._id).catch(() => {})} className="text-slate-500 hover:text-rose-400">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}