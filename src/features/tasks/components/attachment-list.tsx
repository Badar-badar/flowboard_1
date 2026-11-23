import { useRef, useState } from 'react'
import { FileText, Plus, Trash2 } from 'lucide-react'
import { ALLOWED_FILE_TYPES, MAX_FILES, MAX_FILE_SIZE } from '../task-constants'

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
    try { await onUpload(files) } catch (err) {
      const message = typeof err === 'string'
        ? err
        : err instanceof Error
          ? err.message
          : err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
            ? err.message
            : 'Upload failed'
      setError(message)
    }
    setBusy(false)
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-base font-medium text-slate-200">Attachments</h3>
        <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-xs text-slate-300">{attachments.length}</span>
        {canEdit && <button type="button" disabled={busy} onClick={() => input.current?.click()} aria-label="Add attachment" title={busy ? 'Uploading...' : 'Add attachment'} className="rounded p-1 text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-50"><Plus className="h-5 w-5" /></button>}
        <input ref={input} type="file" multiple hidden accept={ALLOWED_FILE_TYPES.join(',')} onChange={pick} />
      </div>

      {error && <p className="mb-2 text-sm text-rose-400">{error}</p>}
      <div className="flex flex-wrap gap-3">
        {attachments.map((a) => (
          <div key={a._id} className="group/attachment relative h-24 w-24 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
            <a href={a.url} target="_blank" rel="noopener noreferrer" title={`${a.fileName} · ${size(a.size)}`} className="flex h-full w-full items-center justify-center">
              {a.mimeType?.startsWith('image/')
                ? <img src={a.url} alt={a.fileName} className="h-full w-full object-cover" />
                : <FileText className="h-8 w-8 text-slate-400" />}
            </a>
            {canEdit && <button type="button" onClick={() => onRemove(a._id).catch(() => setError('Could not remove attachment.'))} aria-label={`Remove ${a.fileName}`} title="Remove attachment" className="absolute right-1 top-1 rounded bg-black/65 p-1 text-white opacity-0 transition-opacity hover:text-rose-300 group-hover/attachment:opacity-100 focus:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>}
          </div>
        ))}
        {canEdit && <button type="button" disabled={busy} onClick={() => input.current?.click()} aria-label="Add attachment" title={busy ? 'Uploading...' : 'Add attachment'} className="flex h-24 w-24 items-center justify-center rounded-xl border border-dashed border-white/20 text-slate-400 transition hover:border-white/40 hover:bg-white/[0.03] hover:text-white disabled:opacity-50"><Plus className="h-8 w-8" /></button>}
      </div>
    </div>
  )
}
