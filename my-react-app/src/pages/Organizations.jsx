import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import OrganizationCard from '../components/OrganizationCard'
import {
  ORG_CATEGORIES,
  fetchOrganizations,
  fetchUpcomingEventCounts,
} from '../services/organizations'

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex gap-4">
        <div className="h-14 w-14 rounded-xl bg-slate-200" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 w-2/3 rounded bg-slate-200" />
          <div className="h-3 w-1/3 rounded bg-slate-200" />
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <div className="h-3 rounded bg-slate-200" />
        <div className="h-3 w-5/6 rounded bg-slate-200" />
      </div>
    </div>
  )
}

function Message({ title, children, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">{children}</p>
      {action}
    </div>
  )
}

const buttonClass =
  'mt-5 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700'

export default function Organizations() {
  const [orgs, setOrgs] = useState([])
  const [counts, setCounts] = useState({})
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [attempt, setAttempt] = useState(0)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchOrganizations(), fetchUpcomingEventCounts()])
      .then(([orgData, countData]) => {
        if (cancelled) return
        setOrgs(orgData)
        setCounts(countData)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orgs.filter(
      (org) =>
        (category === 'All' || org.category === category) &&
        (!q || org.name.toLowerCase().includes(q)),
    )
  }, [orgs, query, category])

  const clearFilters = () => {
    setQuery('')
    setCategory('All')
  }

  return (
    <div className="py-2 sm:py-4">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link to="/" className="hover:text-indigo-700 hover:underline">
          Dashboard
        </Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <span className="text-slate-900">Organizations</span>
      </nav>

      <header className="mt-4 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Find your group on campus
        </h1>
        <p className="mt-2 text-slate-600">
          Browse every club, team, and student group in one place, including the small ones
          that don’t post much.
        </p>
      </header>

      <div className="mt-8 space-y-4">
        <div>
          <label htmlFor="org-search" className="sr-only">
            Search organizations by name
          </label>
          <input
            id="org-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by organization name"
            className="w-full max-w-md rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
          />
        </div>

        <div
          role="group"
          aria-label="Filter by category"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
        >
          {['All', ...ORG_CATEGORIES].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 ${
                category === c
                  ? 'bg-indigo-700 text-white'
                  : 'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <section className="mt-8" aria-live="polite">
        {status === 'loading' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {status === 'error' && (
          <Message
            title="Couldn’t load organizations"
            action={
              <button type="button" onClick={() => {
                  setStatus('loading')
                  setAttempt((a) => a + 1)
                }} className={buttonClass}>
                Try again
              </button>
            }
          >
            Check your connection and try again.
          </Message>
        )}

        {status === 'ready' && orgs.length === 0 && (
          <Message title="No organizations yet">
            Organizations will show up here once organizers add them.
          </Message>
        )}

        {status === 'ready' && orgs.length > 0 && visible.length === 0 && (
          <Message
            title="No organizations match"
            action={
              <button type="button" onClick={clearFilters} className={buttonClass}>
                Clear search and filters
              </button>
            }
          >
            Try a different name or pick another category.
          </Message>
        )}

        {status === 'ready' && visible.length > 0 && (
          <>
            <p className="mb-4 text-sm text-slate-500">
              {visible.length} {visible.length === 1 ? 'organization' : 'organizations'}
            </p>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((org) => (
                <li key={org.id}>
                  <OrganizationCard org={org} upcomingCount={counts[org.id] ?? 0} />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  )
}