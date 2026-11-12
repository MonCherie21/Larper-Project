import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import EventCard from '../components/EventCard'
import StatusPanel from '../components/StatusPanel'
import UiIcon from '../components/UiIcon'
import { displayCategory, EVENT_CATEGORIES, eventMatches } from '../lib/eventFormat'
import { fetchUpcomingEvents } from '../services/events'

export default function Events() {
  const [params, setParams] = useSearchParams()
  const [retry, setRetry] = useState(0)
  const [state, setState] = useState({ status: 'loading', events: [] })
  const query = params.get('q') || ''
  const category = params.get('category') || 'All'

  useEffect(() => {
    let active = true
    fetchUpcomingEvents()
      .then(events => { if (active) setState({ status: 'ready', events }) })
      .catch(() => { if (active) setState({ status: 'error', events: [] }) })
    return () => { active = false }
  }, [retry])

  const categories = useMemo(() => {
    const others = state.events.map(event => displayCategory(event.category))
      .filter(value => !EVENT_CATEGORIES.includes(value))
    return ['All', ...EVENT_CATEGORIES, ...new Set(others)]
  }, [state.events])

  const visible = useMemo(() => state.events.filter(event =>
    (category === 'All' || displayCategory(event.category) === category) &&
    eventMatches(event, query)
  ), [state.events, category, query])

  const updateFilter = (key, value) => {
    setParams(previous => {
      const next = new URLSearchParams(previous)
      if (!value || value === 'All') next.delete(key)
      else next.set(key, value)
      return next
    }, { replace: true })
  }
  const clear = () => setParams({}, { replace: true })
  const refresh = () => {
    setState({ status: 'loading', events: [] })
    setRetry(value => value + 1)
  }

  return (
    <div className="space-y-7 py-2 sm:py-4">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Discover events</h1>

      <section aria-label="Find events" className="space-y-4">
        <div className="relative max-w-xl">
          <label htmlFor="events-search" className="sr-only">Search events</label>
          <UiIcon name="search" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input id="events-search" type="search" value={query}
            onChange={event => updateFilter('q', event.target.value)}
            placeholder="Search by event, keyword, location or organization"
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter event category">
          {categories.map(item => (
            <button key={item} type="button" aria-pressed={item === category}
              onClick={() => updateFilter('category', item)}
              className={'rounded-full border px-4 py-2 text-sm font-medium transition ' +
                (item === category ? 'border-indigo-700 bg-indigo-700 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-700')}>
              {item}
            </button>
          ))}
        </div>
      </section>

      <section aria-label="Event results" className="space-y-5" aria-live="polite">
        {state.status === 'ready' && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">{visible.length} {visible.length === 1 ? 'event' : 'events'} · Soonest first</p>
            {(query || category !== 'All') && <button type="button" onClick={clear} className="text-sm font-semibold text-indigo-700 hover:underline">Clear filters</button>}
          </div>
        )}
        {state.status === 'loading' && <StatusPanel status="loading" />}
        {state.status === 'error' && <StatusPanel status="error" title="Couldn't load events" description="Check your connection and try again." onRetry={refresh} />}
        {state.status === 'ready' && visible.length === 0 && (
          <StatusPanel status="empty" title={state.events.length === 0 ? 'No upcoming events yet' : 'No matching events'} description={state.events.length === 0 ? 'Approved events will appear here once available.' : 'Try another keyword or category.'} />
        )}
        {state.status === 'ready' && visible.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map(event => <EventCard key={event.id} event={event} />)}
          </div>
        )}
      </section>
    </div>
  )
}
