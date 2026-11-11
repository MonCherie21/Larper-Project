import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import EventCard from '../components/EventCard'
import StatusPanel from '../components/StatusPanel'
import RecommendedSection from '../components/RecommendedSection'
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
      .then((events) => { if (active) setState({ status: 'ready', events }) })
      .catch(() => { if (active) setState({ status: 'error', events: [] }) })
    return () => { active = false }
  }, [retry])

  const events = state.events
  // Highlight upcoming events, preferring entries with a poster among the next six.
  const featured = [...events.slice(0, 6)]
    .sort((a, b) => Number(Boolean(b.poster_url)) - Number(Boolean(a.poster_url)))
    .slice(0, 3)

  const submitSearch = (e) => {
    e.preventDefault()
    navigate('/events' + (search.trim() ? '?q=' + encodeURIComponent(search.trim()) : ''))
  }
  const refresh = () => {
    setState({ status: 'loading', events: [] })
    setRetry((n) => n + 1)
  }

  return (
    <div className="space-y-12 pb-10">
      <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-800 via-indigo-700 to-violet-600 px-6 py-10 text-white shadow-lg sm:px-10 sm:py-14 lg:px-14">
        <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full border border-white/15" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-40 right-10 h-80 w-80 rounded-full border border-white/15" aria-hidden="true" />
        <div className="relative max-w-2xl space-y-5">
          <p className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-100">
            Your campus, all in one place
          </p>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Discover what’s happening on campus.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-indigo-100 sm:text-lg">
            Find student activities, competitions, seminars, and opportunities — including events you can follow even if you can’t attend.
          </p>
          <form onSubmit={submitSearch} role="search" className="flex max-w-xl flex-col gap-2 rounded-xl bg-white p-2 shadow-xl sm:flex-row">
            <label htmlFor="home-event-search" className="sr-only">Search campus events</label>
            <input
              id="home-event-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events, topics, or organizers..."
              className="min-w-0 flex-1 rounded-lg px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-400"
            />
            <button type="submit" className="rounded-lg bg-indigo-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-800">Find events →</button>
          </form>
          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1 text-sm text-indigo-100">
            <span>✓ University activities in one feed</span>
            <span>✓ Reviewed events only</span>
          </div>
        </div>
      </section>

      <RecommendedSection />

      <section aria-labelledby="featured-title" className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-700">Worth discovering</p>
            <h2 id="featured-title" className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Featured upcoming events</h2>
          </div>
          <Link to="/events" className="text-sm font-bold text-indigo-700 hover:underline">Explore all events →</Link>
        </div>
        {state.status === 'loading' ? <StatusPanel status="loading" /> :
          state.status === 'error' ? <StatusPanel status="error" title="Events couldn't load" description="Check your connection and try again." onRetry={refresh} /> :
          featured.length === 0 ? <StatusPanel status="empty" title="No upcoming events yet" description="Approved campus events will appear here as soon as organizers publish them." /> :
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((event) => <EventCard key={event.id} event={event} featured />)}
          </div>}
      </section>

      <section className="space-y-5" aria-labelledby="upcoming-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-700">Plan ahead</p>
            <h2 id="upcoming-title" className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">Coming up on campus</h2>
          </div>
          <Link to="/events" className="text-sm font-bold text-indigo-700 hover:underline">View full calendar →</Link>
        </div>
        {state.status === 'ready' && events.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.slice(0, 6).map((event) => <EventCard key={event.id} event={event} />)}
          </div>
        )}
        {state.status === 'ready' && events.length === 0 && (
          <p className="text-sm text-slate-500">No approved upcoming events have been posted.</p>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8" aria-labelledby="explore-title">
        <h2 id="explore-title" className="text-2xl font-extrabold text-slate-900">Explore your interests</h2>
        <p className="mt-1 text-sm text-slate-600">Choose a topic, or see what student organizations are doing.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {EVENT_CATEGORIES.map((category) => (
            <Link key={category} to={'/events?category=' + encodeURIComponent(category)} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-indigo-100 hover:text-indigo-800">
              {category}
            </Link>
          ))}
          <Link to="/organizations" className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100">Student organizations →</Link>
        </div>
      </section>
    </div>
  )
}
