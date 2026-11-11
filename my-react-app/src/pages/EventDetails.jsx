import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EventPoster } from '../components/EventCard'
import StatusPanel from '../components/StatusPanel'
import { useAuth } from '../hooks/useAuth'
import { displayCategory, eventRange } from '../lib/eventFormat'
import { downloadIcs } from '../lib/calendar'
import { fetchEventDetails } from '../services/events'
import { fetchParticipation, fetchPublicRsvpCount, setBookmark, setRsvp } from '../services/student'

export default function EventDetails() {
  const { id } = useParams()
  const { user, loading: authLoading } = useAuth()
  const [retry, setRetry] = useState(0)
  const [state, setState] = useState({ status: 'loading' })
  const [saved, setSaved] = useState({ status: 'loading', key: null })
  const [busy, setBusy] = useState('')
  const [actionError, setActionError] = useState('')
  const [rsvpTotal, setRsvpTotal] = useState(null)

  useEffect(() => {
    let active = true
    fetchEventDetails(id)
      .then((event) => {
        if (active) setState({
          status: 'ready', event, id, retry,
          ended: event ? new Date(event.end_time).getTime() <= Date.now() : false,
        })
      })
      .catch(() => {
        if (active) setState({ status: 'error', id, retry })
      })
    return () => { active = false }
  }, [id, retry])

  useEffect(() => {
    let active = true
    fetchPublicRsvpCount(id).then(count => {
      if (active) setRsvpTotal(count)
    }).catch(() => { if (active) setRsvpTotal(null) })
    return () => { active = false }
  }, [id, retry])

  useEffect(() => {
    if (!user?.id) return undefined
    let active = true
    fetchParticipation(user.id, id)
      .then((participation) => {
        if (active) setSaved({ status: 'ready', key: user.id + ':' + id, ...participation })
      })
      .catch(() => {
        if (active) setSaved({ status: 'error', key: user.id + ':' + id })
      })
    return () => { active = false }
  }, [id, user?.id, retry])

  const refresh = () => {
    setState({ status: 'loading' })
    setSaved({ status: 'loading', key: null })
    setRetry((n) => n + 1)
  }

  async function changeParticipation(kind) {
    if (!user || busy) return
    setBusy(kind)
    setActionError('')
    try {
      if (kind === 'rsvp') {
        const next = !saved.rsvped
        await setRsvp(user.id, id, next)
        setSaved((current) => ({ ...current, rsvped: next }))
        setRsvpTotal((total) => total === null ? total : Math.max(0, total + (next ? 1 : -1)))
      } else {
        const next = !saved.bookmarked
        await setBookmark(user.id, id, next)
        setSaved((current) => ({ ...current, bookmarked: next }))
      }
    } catch (error) {
      setActionError(error.message || 'Could not save your choice. Try again.')
    } finally {
      setBusy('')
    }
  }

  const viewStatus = state.id === id && state.retry === retry ? state.status : 'loading'
  if (viewStatus === 'loading') return <div className="pt-5"><StatusPanel status="loading" /></div>
  if (viewStatus === 'error') return (
    <StatusPanel status="error" title="Couldn't load this event" description="Please check your connection." onRetry={refresh} />
  )
  const { event, ended } = state
  if (!event) return (
    <div className="space-y-5">
      <Link to="/events" className="text-sm font-bold text-indigo-700 hover:underline">← Back to events</Link>
      <StatusPanel status="empty" title="Event not found" description="This event may be unavailable or has not been approved for publication." />
    </div>
  )

  const savedReady = saved.status === 'ready' && saved.key === (user?.id + ':' + id)

  return (
    <article className="mx-auto max-w-4xl space-y-8 pb-12">
      <Link to="/events" className="inline-flex text-sm font-bold text-indigo-700 hover:underline">← All events</Link>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <EventPoster key={event.id} event={event} className="h-56 w-full sm:h-80" />
        <div className="space-y-6 p-5 sm:p-9">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{displayCategory(event.category)}</span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">Approved campus event</span>
          </div>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">{event.title}</h1>
          <div className="grid gap-4 rounded-2xl bg-slate-50 p-5 text-sm sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Date and time</p>
              <p className="font-semibold text-slate-900">{eventRange(event)}</p>
              <p className="mt-1 text-xs text-slate-500">Philippine time</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Location</p>
              <p className="font-semibold text-slate-900">{event.location || 'Venue to be announced'}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Organized by</p>
              {event.organizations?.id ? (
                <Link to={'/organizations/' + event.organizations.id} className="font-semibold text-indigo-700 hover:underline">{event.organizations.name}</Link>
              ) : <p className="font-semibold text-slate-900">Campus organizer</p>}
            </div>
          </div>
          <section className="space-y-3" aria-labelledby="about-event">
            <h2 id="about-event" className="text-xl font-extrabold text-slate-900">About this event</h2>
            <p className="whitespace-pre-line leading-7 text-slate-700">{event.description || 'The organizing group has not yet added further event details.'}</p>
          </section>

          <section className="space-y-3 border-t border-slate-100 pt-6" aria-labelledby="calendar-title">
            <h2 id="calendar-title" className="text-xl font-extrabold text-slate-900">Save the date</h2>
            <p className="text-sm text-slate-600">Export this approved event to Apple Calendar, Outlook, or another calendar app. Calendar export doesn't require signing in.</p>
            <button type="button" onClick={() => downloadIcs(event)}
              className="rounded-xl border border-indigo-300 bg-white px-5 py-3 text-sm font-bold text-indigo-700 hover:bg-indigo-50">
              Download calendar (.ics)
            </button>
          </section>
          <section className="space-y-3 border-t border-slate-100 pt-6" aria-labelledby="participation-title">
            <h2 id="participation-title" className="text-xl font-extrabold text-slate-900">Participation & RSVP</h2>
            {rsvpTotal !== null && <p className="text-sm font-semibold text-indigo-700">{rsvpTotal} {rsvpTotal === 1 ? 'student has' : 'students have'} RSVP'd</p>}
            <p className="text-sm leading-relaxed text-slate-600">
              RSVP records your interest in attending. It does not guarantee a seat or confirm that you meet participation requirements. Check with the organizer for eligibility and official registration instructions.
            </p>
            {ended && <p className="rounded-xl bg-slate-100 p-4 text-sm font-semibold text-slate-600">This event has ended. New RSVPs are closed, but you can still manage an existing RSVP or bookmark.</p>}
            {authLoading ? (
              <p className="text-sm text-slate-500">Checking your account...</p>
            ) : !user ? (
              <Link to={'/sign-in?next=' + encodeURIComponent('/events/' + id)} className="inline-block rounded-xl bg-indigo-700 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-800">
                Sign in to RSVP or bookmark
              </Link>
            ) : (
              <div className="space-y-3">
                {savedReady ? (
                  <div className="flex flex-wrap gap-3">
                    <button type="button" disabled={Boolean(busy) || (ended && !saved.rsvped)} onClick={() => changeParticipation('rsvp')} className={'rounded-xl px-5 py-3 text-sm font-bold transition disabled:opacity-50 ' + (saved.rsvped ? 'border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100' : 'bg-indigo-700 text-white hover:bg-indigo-800')}>
                      {busy === 'rsvp' ? 'Saving...' : saved.rsvped ? '✓ RSVP saved · Cancel RSVP' : 'RSVP for this event'}
                    </button>
                    <button type="button" disabled={Boolean(busy)} onClick={() => changeParticipation('bookmark')} className={'rounded-xl border px-5 py-3 text-sm font-bold transition disabled:opacity-50 ' + (saved.bookmarked ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50')}>
                      {busy === 'bookmark' ? 'Saving...' : saved.bookmarked ? '★ Bookmarked · Remove' : '☆ Save to bookmarks'}
                    </button>
                  </div>
                ) : saved.status === 'error' && saved.key === (user.id + ':' + id) ? (
                  <div className="space-y-2">
                    <p role="alert" className="text-sm text-rose-700">Could not check your RSVP or bookmarks. Make sure the Feature 03 SQL permissions are applied.</p>
                    <button type="button" onClick={refresh} className="text-sm font-bold text-indigo-700 hover:underline">Retry</button>
                  </div>
                ) : <p className="text-sm text-slate-500">Loading your RSVP and bookmarks...</p>}
                {actionError && <p role="alert" className="text-sm text-rose-700">{actionError}</p>}
              </div>
            )}
          </section>
        </div>
      </div>
    </article>
  )
}
