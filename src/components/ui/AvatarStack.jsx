import Avatar from './Avatar'

export default function AvatarStack({ members = [], total = members.length }) {
  const extra = total - members.length
  return (
    <div className="flex items-center -space-x-2">
      {members.map((m) => <Avatar key={m._id} name={m.name} />)}
      {extra > 0 && (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3a3b3d] text-xs text-slate-300 ring-2 ring-[#1e1f21]">
          +{extra}
        </span>
      )}
    </div>
  )
}