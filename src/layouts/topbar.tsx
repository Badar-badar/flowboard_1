import { useEffect, useRef } from 'react'
import { Menu, Search, Plus, Sparkles } from 'lucide-react'

export default function Topbar({ onMenuClick }) {
  const searchRef = useRef(null)

  // Ctrl/Cmd + K focuses the search
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className="z-10 flex h-[49px] shrink-0 items-center gap-3 border-b border-white/10 bg-[#252525] px-5 text-slate-200">
      {/* Hamburger */}
      <button
        onClick={onMenuClick}
        aria-label="Toggle sidebar"
        className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Create pill */}
      <button className="flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1.5 pl-1.5 pr-4 text-sm font-medium text-white transition hover:bg-white/10">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f65353]">
          <Plus className="h-3 w-3" strokeWidth={2} />
        </span>
        Create
      </button>

      {/* Search */}
      <div className="relative mx-auto w-full max-w-[550px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          ref={searchRef}
          type="text"
          placeholder="Search"
          className="w-full rounded-full border border-white/15 bg-white/5 py-1.5 pl-9 pr-24 text-sm text-white placeholder-slate-400 outline-none transition focus:border-white/30 focus:bg-white/10"
        />
        <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 gap-1">
          <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-slate-400">Ctrl</kbd>
          <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-slate-400">K</kbd>
        </div>
      </div>

      <button className="flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-1.5 py-1.5 text-sm font-medium text-white hover:bg-white/10">
        <Sparkles className="h-5 w-5 text-[#f65353]" fill="currentColor" />
        <span>Work with Dash</span>
      </button>
    </header>
  )
}
