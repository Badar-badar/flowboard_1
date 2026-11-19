const getInitials = (name = '') => {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return '?'
  return words.length > 1
    ? `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
    : words[0].slice(0, 2).toUpperCase()
}

export default function Avatar({ name = '', className = '' }) {
  return (
    <span
      aria-label={name || 'Unknown member'}
      title={name || 'Unknown member'}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-200 text-xs font-medium text-slate-800 ring-2 ring-[#1e1f21] ${className}`}
    >
      {getInitials(name)}
    </span>
  )
}
