import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import OrganizerGate from '../components/OrganizerGate'
import StatusBadge from '../components/StatusBadge'
import {
  createEvent, EVENT_CATEGORIES, fetchEventForEdit, friendlyError,
  POSTER_MAX_BYTES, POSTER_TYPES, updateEvent,
} from '../services/organizerEvents'

function toLocalInput(iso) {
  const date = new Date(iso)
  const pad = (number) => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const EMPTY = { title: '', description: '', category: 'Academic', location: '', start: '', end: '' }
const fieldStyle = 'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'

function EventEditor({ org, initial }) {
  const navigate = useNavigate()
  const editing = Boolean(initial)
  const [values, setValues] = useState(() => initial ? {
    title: initial.title || '',
    description: initial.description || '',
    category: initial.category || 'Academic',
    location: initial.location || '',
    start: toLocalInput(initial.start_time),
    end: toLocalInput(initial.end_time),
  } : EMPTY)
  const [poster, setPoster] = useState(null)
  const [removePoster, setRemovePoster] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function field(key, value) {
    setValues((old) => ({ ...old, [key]: value }))
  }

  function selectPoster(file) {
    if (!file) { setPoster(null); return }
    if (!POSTER_TYPES.includes(file.type)) { setError('Poster must be JPG, PNG, or WebP.'); return }
    if (file.size > POSTER_MAX_BYTES) { setError('Poster must be 5 MB or smaller.'); return }
    if (file.size === 0) { setError('Selected poster is empty.'); return }
    setError('')
    setPoster(file)
    setRemovePoster(false)
  }

  async function save(event) {
    event.preventDefault()
    if (busy) return
    const start = new Date(values.start)
    const end = new Date(values.end)
    if (!values.title.trim() || !values.description.trim() || !values.location.trim() || !values.category) {
      setError('Please complete the title, description, category, and location.')
      return
    }
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
      setError('Choose valid start and end times. The end must be after the start.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const result = editing
        ? await updateEvent({ event: initial, values, posterFile: poster, removePoster })
        : await createEvent({ organizationId: org.id, values, posterFile: poster })
      const text = editing ? 'Event saved.' : 'Event submitted.'
      const notice = result.approval_status === 'pending'
        ? text + ' It is pending administrator verification and official clearances before publication.'
        : text + ' Current status: ' + result.approval_status + '.'
      navigate('/organizer?org=' + org.id, { replace: true, state: { notice } })
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  const existingPoster = Boolean(initial?.poster_url) && !removePoster && !poster

  return (
    <div className="mx-auto max-w-3xl space-y-7 pb-10">
      <Link to={'/organizer?org=' + org.id} className="text-sm font-bold text-indigo-700 hover:underline">← Back to organizer events</Link>
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-700">{org.name}</p>
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">{editing ? 'Edit event' : 'Create an event'}</h1>
        <p className="text-sm leading-relaxed text-slate-600">Events are reviewed before appearing on Campus Connect. This form does not replace your university's paperwork or dean approval process.</p>
        {editing && <StatusBadge status={initial.approval_status} />}
      </header>
      <form onSubmit={save} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div>
          <label htmlFor="event-org" className="block text-sm font-bold text-slate-800">Organization</label>
          <input id="event-org" type="text" disabled value={org.name} className={fieldStyle + ' bg-slate-50 text-slate-600'} />
          <p className="mt-1.5 text-xs text-slate-500">Events can only be created for an organization assigned to your account.</p>
        </div>
        <div>
          <label htmlFor="event-title" className="block text-sm font-bold text-slate-800">Event title *</label>
          <input id="event-title" type="text" maxLength={150} required value={values.title} onChange={(e) => field('title', e.target.value)} placeholder="e.g. Student Research Forum" className={fieldStyle} />
        </div>
        <div>
          <label htmlFor="event-description" className="block text-sm font-bold text-slate-800">Description *</label>
          <textarea id="event-description" rows={5} required maxLength={4000} value={values.description} onChange={(e) => field('description', e.target.value)} placeholder="Explain the event, agenda, and who is welcome to attend." className={fieldStyle} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="event-category" className="block text-sm font-bold text-slate-800">Category *</label>
            <select id="event-category" value={values.category} onChange={(e) => field('category', e.target.value)} required className={fieldStyle}>
              {[...new Set([values.category, ...EVENT_CATEGORIES].filter(Boolean))].map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="event-location" className="block text-sm font-bold text-slate-800">Venue / location *</label>
            <input id="event-location" type="text" required maxLength={200} value={values.location} onChange={(e) => field('location', e.target.value)} placeholder="e.g. CCS Building, Room 301" className={fieldStyle} />
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="event-start" className="block text-sm font-bold text-slate-800">Start date and time *</label>
            <input id="event-start" type="datetime-local" required value={values.start} onChange={(e) => field('start', e.target.value)} className={fieldStyle} />
          </div>
          <div>
            <label htmlFor="event-end" className="block text-sm font-bold text-slate-800">End date and time *</label>
            <input id="event-end" type="datetime-local" required min={values.start || undefined} value={values.end} onChange={(e) => field('end', e.target.value)} className={fieldStyle} />
          </div>
        </div>
        <div>
          <label htmlFor="event-poster" className="block text-sm font-bold text-slate-800">Event poster (optional)</label>
          <input id="event-poster" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => selectPoster(e.target.files?.[0])} className="mt-2 block w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-100 file:px-3 file:py-2 file:font-semibold file:text-indigo-700" />
          <p className="mt-2 text-xs text-slate-500">PNG, JPG or WebP, up to 5 MB. Do not upload private approval documents here.</p>
          {poster && <p className="mt-2 text-sm font-medium text-indigo-700">Selected: {poster.name}</p>}
          {existingPoster && (
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <img src={initial.poster_url} alt="Current event poster" className="h-24 w-36 rounded-xl object-cover" />
              <button type="button" onClick={() => setRemovePoster(true)} className="text-sm font-semibold text-rose-700 hover:underline">Remove current poster</button>
            </div>
          )}
          {removePoster && <p className="mt-2 text-sm text-rose-700">Current poster will be removed when you save.</p>}
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          <strong>University approval remains required.</strong> Your event will stay pending until administrators verify the applicable paperwork, clearances, and dean's approval. Editing an approved or rejected event sends it back for review.
        </div>
        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={busy} className="rounded-xl bg-indigo-700 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-800 disabled:opacity-50">{busy ? 'Saving...' : editing ? 'Save changes' : 'Submit for review'}</button>
          <Link to={'/organizer?org=' + org.id} className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Cancel</Link>
        </div>
      </form>
    </div>
  )
}

function EditLoader({ id, organizations }) {
  const [result, setResult] = useState({ status: 'loading', id: null })
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    fetchEventForEdit(id)
      .then((event) => { if (active) setResult({ status: 'ready', id, retry, event }) })
      .catch(() => { if (active) setResult({ status: 'error', id, retry }) })
    return () => { active = false }
  }, [id, retry])

  if (result.id !== id || result.retry !== retry) return <p className="text-sm text-slate-600" aria-busy="true">Loading event...</p>
  if (result.status === 'error') return (
    <div role="alert" className="rounded-2xl border border-slate-200 bg-white p-8">
      <h1 className="text-xl font-bold">Could not load the event</h1>
      <button type="button" onClick={() => setRetry((n) => n + 1)} className="mt-4 font-semibold text-indigo-700 hover:underline">Try again</button>
    </div>
  )
  const org = organizations.find((item) => item.id === result.event?.organization_id)
  if (!result.event || !org) return <div role="alert" className="rounded-xl border border-slate-200 bg-white p-8 text-slate-700">Event not found, or you do not manage its organization.</div>
  return <EventEditor key={result.event.id} org={org} initial={result.event} />
}

export default function OrganizerEventForm() {
  const { id } = useParams()
  const [params] = useSearchParams()
  return (
    <OrganizerGate>{({ organizations }) => {
      if (id) return <EditLoader key={id} id={id} organizations={organizations} />
      const org = organizations.find((item) => item.id === params.get('org')) || organizations[0]
      return <EventEditor key={'new:' + org.id} org={org} initial={null} />
    }}</OrganizerGate>
  )
}
