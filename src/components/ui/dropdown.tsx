import { useEffect, useRef, useState, type ReactNode } from 'react'

interface DropdownProps {
  trigger: (state: { open: boolean; toggle: () => void }) => ReactNode
  children: ReactNode | ((state: { close: () => void }) => ReactNode)
  align?: 'left' | 'right'
  width?: string
}

export default function Dropdown({ trigger, children, align = 'left', width = 'w-64' }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (ref.current && event.target instanceof Node && !ref.current.contains(event.target)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const close = () => setOpen(false)

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {open && (
        <div
          className={`absolute z-40 mt-2 ${align === 'right' ? 'right-0' : 'left-0'} ${width} rounded-xl border border-white/10 bg-[#2a2b2d] py-1 shadow-2xl`}
        >
          {typeof children === 'function' ? children({ close }) : children}
        </div>
      )}
    </div>
  )
}
