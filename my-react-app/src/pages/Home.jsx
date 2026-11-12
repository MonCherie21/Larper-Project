import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import EventCard from '../components/EventCard'
import CampusSchedule from '../components/CampusSchedule'
import RecommendedSection from '../components/RecommendedSection'
import StatusPanel from '../components/StatusPanel'
import UiIcon from '../components/UiIcon'
import { EVENT_CATEGORIES } from '../lib/eventFormat'
import { fetchUpcomingEvents } from '../services/events'

export default function Home() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [retry, setRetry] = useState(0)
  const [state, setState] = useState({ status: 'loading', events: [] })

  useEffect(() => {
    let active = true
    fetchUpcomingEvents()
      .then(events => { if (active) setState({ status: 'ready', events }) })
      .catch(() => { if (active) setState({ status: 'error', events: [] }) })
    return () => { active = false }
  }, [retry])

  function submitSearch(event) {
    event.preventDefault()
    navigate('/events' + (search.trim() ? '?q=' + encodeURIComponent(search.trim()) : ''))
  }
  function refresh() {
    setState({ status: 'loading', events: [] })
    setRetry(value => value + 1)
  }

  const events = state.events
  const featured = [...events.slice(0, 8)]
    .sort((a, b) => Number(Boolean(b.poster_url)) - Number(Boolean(a.poster_url)))
    .slice(0, 2)

  return (
    <div className="space-y-10 pb-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-700">Campus Connect</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Campus dashboard</h1>
        </div>
        <Link to="/events" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-indigo-300 hover:text-indigo-700">
          <UiIcon name="calendar" /> Browse events
        </Link>
      </header>

      {state.status === 'loading' && <StatusPanel status="loading" />}
      {state.status === 'error' && <StatusPanel status="error" title="Couldn't load upcoming events" description="Check your connection and try again." onRetry={refresh} />}
      {state.status === 'ready' && <CampusSchedule events={events} />}

      <RecommendedSection />

      {state.status === 'ready' && featured.length > 0 && (
        <section aria-labelledby="featured-title" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="featured-title" className="text-2xl font-bold tracking-tight text-slate-900">Featured events</h2>
            <Link to="/events" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:underline">
              More events <UiIcon name="arrowRight" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {featured.map(event => <EventCard key={event.id} event={event} featured />)}
          </div>
        </section>
      )}

      <section aria-labelledby="browse-interests" className="space-y-3">
        <h2 id="browse-interests" className="text-xl font-bold text-slate-900">Browse by category</h2>
        <div className="flex flex-wrap gap-2">
          {EVENT_CATEGORIES.map(category => (
            <Link key={category} to={'/events?category=' + encodeURIComponent(category)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700">
              {category}
            </Link>
          ))}
          <Link to="/organizations" className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100">
            <UiIcon name="users" /> Clubs and Organizations
          </Link>
        </div>
      </section>

      <section aria-labelledby="hero-title" className="relative isolate overflow-hidden rounded-3xl bg-indigo-800 px-6 py-8 text-white sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border border-white/10" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-36 right-24 h-60 w-60 rounded-full border border-white/10" aria-hidden="true" />
        <div className="relative max-w-xl">
          <h2 id="hero-title" className="text-2xl font-bold tracking-tight sm:text-3xl">Find your next campus event.</h2>
          <form onSubmit={submitSearch} role="search" className="mt-5 flex flex-col gap-2 rounded-xl bg-white p-1.5 shadow-sm sm:flex-row">
            <label htmlFor="dashboard-search" className="sr-only">Search campus events</label>
            <div className="flex min-w-0 flex-1 items-center gap-2 px-3 text-slate-500">
              <UiIcon name="search" className="h-5 w-5" />
              <input id="dashboard-search" type="search" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search events or organizations"
                className="w-full min-w-0 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400" />
            </div>
            <button type="submit" className="rounded-lg bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-900">
              Search
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
