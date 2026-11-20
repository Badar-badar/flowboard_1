import { useState } from 'react'
import { User, X } from 'lucide-react'
import Dropdown from '../../../components/ui/dropdown'
import Avatar from '../../../components/ui/avatar'

export default function AssigneePicker({ members, assigneeId, canEdit, onChange, showName = true }) {
  const [query, setQuery] = useState('')
  const current = members.find((m) => m._id === assigneeId)

  const display = current ? (
    <span className="flex items-center gap-2">
      <Avatar name={current.name} size="h-7 w-7" className="ring-0" />
      {showName && <span className="truncate text-sm text-slate-200">{current.name}</span>}
    </span>
  ) : (
    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-slate-500 text-slate-500">
      <User className="h-4 w-4" />
    </span>
  )

  if (!canEdit) return <div className="flex items-center">{display}</div>

  const list = members.filter((m) => (m.name + m.email).toLowerCase().includes(query.toLowerCase()))

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Dropdown
        width="w-64"
        trigger={({ toggle }) => (
          <button type="button" onClick={toggle} className="flex items-center rounded-md p-1 hover:bg-white/10">{display}</button>
        )}
      >
        {({ close }) => (
          <div>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search members"
              className="mx-2 mb-1 mt-1 w-[calc(100%-1rem)] rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-white outline-none"
            />
            <ul className="max-h-56 overflow-y-auto">
              {list.map((m) => (
                <li key={m._id}>
                  <button
                    onClick={() => { onChange(m._id); close() }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-white/5"
                  >
                    <Avatar name={m.name} size="h-7 w-7" className="ring-0" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-white">{m.name}</span>
                      <span className="block truncate text-xs text-slate-400">{m.email}</span>
                    </span>
                  </button>
                </li>
              ))}
              {!list.length && <li className="px-3 py-2 text-sm text-slate-400">No members found</li>}
            </ul>
            {current && (
              <button
                onClick={() => { onChange(null); close() }}
                className="flex w-full items-center gap-2 border-t border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
              >
                <X className="h-4 w-4" /> Unassign
              </button>
            )}
          </div>
        )}
      </Dropdown>
    </div>
  )
}