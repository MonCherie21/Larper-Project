import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import UiIcon from './UiIcon'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const links = [
  { to: '/', label: 'Dashboard', icon: 'home', end: true },
  { to: '/events', label: 'Events', icon: 'calendar' },
  { to: '/organizations', label: 'Organizations', icon: 'users' },
  { to: '/bookmarks', label: 'Bookmarks', icon: 'bookmark' },
  { to: '/profile', label: 'Profile', icon: 'user' },
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
  const showAdmin = user && roleInfo.id === user.id && roleInfo.role === 'admin'
  const withOrganizer = showOrganizer ? [...links.slice(0, 3), { to: '/organizer', label: 'Organizer', icon: 'briefcase' }, ...links.slice(3)] : links
  const visible = showAdmin ? [...withOrganizer.slice(0, 3), { to: '/admin', label: 'Admin', icon: 'shield' }, ...withOrganizer.slice(3)] : withOrganizer

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav aria-label="Main navigation" className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <NavLink to="/" aria-label="Campus Connect home"
          className="flex shrink-0 items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900">
          <img src="/brand-mark.svg" alt="" aria-hidden="true" className="h-10 w-10 shrink-0 rounded-xl" />
          <span>Campus <span className="text-indigo-700">Connect</span></span>
        </NavLink>
        <div className="order-3 -mx-4 flex w-[calc(100%+2rem)] items-center gap-1 overflow-x-auto px-4 pb-1 sm:order-2 sm:mx-0 sm:w-auto sm:overflow-visible sm:px-0 sm:pb-0">
          {visible.map(({ to, label, icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => 'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors ' +
                (isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}>
              <UiIcon name={icon} className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  )
}
