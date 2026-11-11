import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/events', label: 'Events' },
  { to: '/organizations', label: 'Organizations' },
  { to: '/bookmarks', label: 'Bookmarks' },
  { to: '/profile', label: 'Profile' },
]

export default function Navbar() {
  const { user } = useAuth()
  const [roleInfo, setRoleInfo] = useState({ id: null, role: null })

  useEffect(() => {
    if (!user?.id || !supabase) return undefined
    let active = true
    supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      .then(({ data, error }) => {
        if (active) setRoleInfo({ id: user.id, role: error ? null : data?.role || null })
      })
    return () => { active = false }
  }, [user?.id])

  const showOrganizer = user && roleInfo.id === user.id && ['organizer', 'admin'].includes(roleInfo.role)
  const visible = showOrganizer ? [...links.slice(0, 3), { to: '/organizer', label: 'Organizer' }, ...links.slice(3)] : links

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav aria-label="Main navigation" className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <NavLink to="/" className="flex shrink-0 items-center gap-2.5 text-lg font-extrabold tracking-tight text-slate-900">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-700 text-white shadow-sm" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M3 7l9-4 9 4-9 4-9-4ZM7 9v6c3.4 3 6.6 3 10 0V9M21 8v8" />
            </svg>
          </span>
          Campus <span className="text-indigo-700">Connect</span>
        </NavLink>
        <div className="order-3 -mx-4 flex w-[calc(100%+2rem)] items-center gap-1 overflow-x-auto px-4 pb-1 sm:order-2 sm:mx-0 sm:w-auto sm:overflow-visible sm:px-0 sm:pb-0">
          {visible.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => 'shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ' +
                (isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}>
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  )
}
