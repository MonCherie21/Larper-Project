import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/events', label: 'Events' },
  { to: '/organizations', label: 'Organizations' },
]

export default function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <nav aria-label="Main navigation" className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <NavLink to="/" className="text-lg font-bold text-indigo-700">Campus Connect</NavLink>
        <div className="flex flex-wrap gap-2">
          {links.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
            >
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  )
}
