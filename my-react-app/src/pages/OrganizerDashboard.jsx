import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import OrganizerGate from '../components/OrganizerGate'
import StatusBadge from '../components/StatusBadge'
import { CategoryBadge, OrgLogo } from '../components/OrganizationCard'
import { eventRange } from '../lib/eventFormat'
import { deleteEvent, fetchOrganizerEvents, friendlyError } from '../services/organizerEvents'

const FILTERS = ['all', 'pending', 'approved', 'rejected']

function EventRow({ event, confirmDelete, busy, onAskDelete, onCancelDelete, onDelete }) {
  return (
    <li className="border-b border-slate-100 p-5 last:border-b-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {event.poster_url ? (
          <img src={event.poster_url} alt="" className="h-24 w-full shrink-0 rounded-xl bg-indigo-50 object-cover sm:w-32" />
        ) : (
          <div aria-hidden="true" className="flex h-24 w-full shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-3xl text-indigo-700 sm:w-32">▣</div>
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">{event.title}</h3>
            <StatusBadge status={event.approval_status} />
          </div>
          <p className="text-sm text-slate-600">{eventRange(event)}</p>
          <p className="text-sm text-slate-600">{event.location || 'Venue to be announced'}</p>
          <p className="text-sm font-semibold text-slate-700">
            {event.rsvp_count === null ? 'RSVP count unavailable' : `${event.rsvp_count} ${event.rsvp_count === 1 ? 'RSVP' : 'RSVPs'}`}
          </p>
          {event.approval_status === 'pending' && <p className="text-xs text-slate-500">Students cannot see this event until it has been approved.</p>}
          {event.approval_status === 'rejected' && <p className="text-xs text-slate-500">Edit and resubmit this event for a new review.</p>}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link to={'/organizer/events/' + event.id + '/edit'} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Edit</Link>
          <button type="button" onClick={onAskDelete} disabled={busy} className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">Delete</button>
        </div>
      </div>
      {confirmDelete && (
        <div className="mt-4 space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-medium text-rose-900">Delete “{event.title}”? This cannot be undone{event.rsvp_count > 0 ? ` and will also remove ${event.rsvp_count} associated RSVPs` : ''}.</p>
          <div className="flex gap-2">
            <button type="button" disabled={busy} autoFocus onClick={onCancelDelete} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
            <button type="button" disabled={busy} onClick={onDelete} className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-50">{busy ? 'Deleting...' : 'Delete event'}</button>
          </div>
        </div>
      )}
    </li>
  )
}

function Dashboard({ organizations }) {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const org = organizations.find((o) => o.id === params.get('org')) || organizations[0]
  const [reload, setReload] = useState(0)
  const [list, setList] = useState({ status: 'loading', orgId: null, reload: -1, events: [] })
  const [filter, setFilter] = useState('all')
  const [confirmId, setConfirmId] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(location.state?.notice || '')

  useEffect(() => {
    let active = true
    fetchOrganizerEvents(org.id)
      .then((events) => { if (active) setList({ status: 'ready', orgId: org.id, reload, events }) })
      .catch(() => { if (active) setList({ status: 'error', orgId: org.id, reload, events: [] }) })
    return () => { active = false }
  }, [org.id, reload])

  const current = list.orgId === org.id && list.reload === reload ? list : { status: 'loading', events: [] }
  const counts = current.events.reduce((acc, event) => {
    acc[event.approval_status] = (acc[event.approval_status] || 0) + 1
    return acc
  }, { all: current.events.length })
  const shown = filter === 'all' ? current.events : current.events.filter((event) => event.approval_status === filter)

  async function confirmDelete(event) {
    setBusyId(event.id)
    setError('')
    try {
      await deleteEvent(event)
      setList((prior) => ({ ...prior, events: prior.events.filter((item) => item.id !== event.id) }))
      setConfirmId(null)
      setNotice(`“${event.title}” was deleted.`)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusyId(null)
    }
  }

  function switchOrg(id) {
    setParams({ org: id })
    setFilter('all')
    setConfirmId(null)
    setError('')
    setNotice('')
  }

  return (
    <div className="space-y-7 pb-10">
      <header>
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">Organizer workspace</p>
        <h1 className="mt-1 text-3xl font-extrabold text-slate-900 sm:text-4xl">Manage your events</h1>
        <p className="mt-2 text-slate-600">Submit campus activities for review and keep track of their publication status.</p>
      </header>
      {organizations.length > 1 && (
        <div className="max-w-md">
          <label htmlFor="org-choice" className="block text-sm font-semibold text-slate-700">Organization</label>
          <select id="org-choice" value={org.id} onChange={(e) => switchOrg(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm">
            {organizations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>
      )}
      <section aria-label="Current organization" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex min-w-0 items-center gap-4">
          <OrgLogo org={org} />
          <div className="min-w-0 space-y-1">
            <h2 className="truncate text-lg font-bold text-slate-900">{org.name}</h2>
            <div className="flex flex-wrap items-center gap-2"><CategoryBadge category={org.category} /><Link to={'/organizations/' + org.id} className="text-sm font-semibold text-indigo-700 hover:underline">View public profile</Link></div>
          </div>
        </div>
        <Link to={'/organizer/events/new?org=' + org.id} className="rounded-xl bg-indigo-700 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-800">+ Create event</Link>
      </section>
      {notice && (
        <div role="status" className="flex items-start justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <span>{notice}</span>
          <button type="button" onClick={() => { setNotice(''); navigate(location.pathname + location.search, { replace: true, state: null }) }} className="font-semibold underline">Dismiss</button>
        </div>
      )}
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}
      <section className="space-y-5" aria-label="Your organization's events">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by approval status">
          {FILTERS.map((item) => <button type="button" key={item} aria-pressed={filter === item} onClick={() => setFilter(item)}
            className={'rounded-full px-4 py-2 text-sm font-semibold capitalize ' + (filter === item ? 'bg-indigo-700 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-indigo-50')}>
            {item} ({counts[item] || 0})
          </button>)}
        </div>
        {current.status === 'loading' && <div className="animate-pulse space-y-3" aria-busy="true"><div className="h-28 rounded-xl bg-slate-200" /><div className="h-28 rounded-xl bg-slate-200" /></div>}
        {current.status === 'error' && <div role="alert" className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><p>Could not load organization events.</p><button type="button" onClick={() => setReload((n) => n + 1)} className="mt-4 font-semibold text-indigo-700 hover:underline">Try again</button></div>}
        {current.status === 'ready' && shown.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <h2 className="text-lg font-bold">{current.events.length === 0 ? 'No events yet' : 'No events with this status'}</h2>
            <p className="mt-2 text-sm text-slate-600">{current.events.length === 0 ? 'Create your first event to send it for review.' : 'Choose another status to see your events.'}</p>
          </div>
        )}
        {current.status === 'ready' && shown.length > 0 && (
          <ul className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {shown.map((event) => <EventRow key={event.id} event={event} confirmDelete={confirmId === event.id} busy={busyId === event.id}
              onAskDelete={() => { setConfirmId(event.id); setError('') }} onCancelDelete={() => setConfirmId(null)} onDelete={() => confirmDelete(event)} />)}
          </ul>
        )}
      </section>
    </div>
  )
}

export default function OrganizerDashboard() {
  return <OrganizerGate>{({ organizations }) => <Dashboard organizations={organizations} />}</OrganizerGate>
}
