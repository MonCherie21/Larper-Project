import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminGate from '../components/AdminGate'
import StatusBadge from '../components/StatusBadge'
import StatusPanel from '../components/StatusPanel'
import { eventRange } from '../lib/eventFormat'
import { fetchModerationEvents, moderateEvent } from '../services/admin'

const tabs = ['pending', 'approved', 'rejected', 'all']

function ReviewCard({ event, adminId, onSaved }) {
  const [paperwork, setPaperwork] = useState(Boolean(event.paperwork_verified))
  const [dean, setDean] = useState(Boolean(event.dean_approved))
  const [reason, setReason] = useState(event.rejection_reason || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')

  const selfOwned = event.organizations?.owner_id === adminId

  async function submit(decision) {
    if (busy) return
    setBusy(true)
    setError('')
    setNote('')
    try {
      const updated = await moderateEvent(event, decision, paperwork, dean, reason)
      onSaved(updated)
      setNote(decision === 'approved' ? 'Event published.' : decision === 'rejected' ? 'Event rejected.' : 'Event unpublished and returned to pending.')
    } catch (err) {
      setError(err.message || 'Could not save decision.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-5 p-5 md:grid-cols-[180px_1fr] sm:p-6">
        {event.poster_url ? (
          <img src={event.poster_url} alt={'Event poster for ' + event.title} loading="lazy" className="h-40 w-full rounded-xl bg-indigo-100 object-cover" />
        ) : <div className="flex h-40 items-center justify-center rounded-xl bg-indigo-100 text-4xl text-indigo-600" aria-label="No event poster">▣</div>}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">{event.title}</h2>
            <StatusBadge status={event.approval_status} />
          </div>
          <p className="text-sm font-semibold text-indigo-700">{event.organizations?.name || 'Unknown organization'}</p>
          <p className="text-sm text-slate-600">{eventRange(event)} · {event.location || 'Venue to be announced'}</p>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{event.description || 'No description supplied.'}</p>
          {event.rejection_reason && event.approval_status === 'rejected' &&
            <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">Last rejection reason: {event.rejection_reason}</p>}
          <p className="text-xs text-slate-500">
            An administrator verifies university paperwork and in-person dean approval; Campus Connect does not grant the dean's official authorization.
          </p>
        </div>
      </div>
      <div className="space-y-4 border-t border-slate-100 bg-slate-50 p-5 sm:p-6">
        <h3 className="font-bold text-slate-900">Publication clearance</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <input type="checkbox" checked={paperwork} disabled={busy} onChange={(e) => setPaperwork(e.target.checked)} className="mt-1 h-4 w-4 accent-indigo-700" />
            <span><strong className="block text-sm">Paperworks ✓</strong><span className="text-xs text-slate-600">Applicable event documents and signatures verified.</span></span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <input type="checkbox" checked={dean} disabled={busy} onChange={(e) => setDean(e.target.checked)} className="mt-1 h-4 w-4 accent-indigo-700" />
            <span><strong className="block text-sm">Dean Approval ✓</strong><span className="text-xs text-slate-600">Official approval received in person and confirmed.</span></span>
          </label>
        </div>
        <div>
          <label htmlFor={'review-reason-' + event.id} className="block text-sm font-semibold text-slate-800">Rejection / unpublication reason</label>
          <textarea id={'review-reason-' + event.id} rows={2} value={reason} disabled={busy} onChange={(e) => setReason(e.target.value)}
            placeholder="Explain what needs correction before resubmission..." maxLength={2000}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
        </div>
        {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        {note && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{note}</p>}
        <div className="flex flex-wrap gap-3">
          {event.approval_status !== 'approved' && (
            <button disabled={busy || !paperwork || !dean || selfOwned} type="button" onClick={() => submit('approved')}
              className="rounded-xl bg-indigo-700 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50">
              {busy ? 'Saving...' : 'Approve & publish'}
            </button>
          )}
          {event.approval_status !== 'rejected' && (
            <button disabled={busy || !reason.trim()} type="button" onClick={() => submit('rejected')}
              className="rounded-xl border border-rose-300 bg-white px-5 py-3 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50">
              Reject event
            </button>
          )}
          {event.approval_status === 'approved' && (
            <button disabled={busy} type="button" onClick={() => submit('pending')}
              className="rounded-xl border border-amber-300 bg-white px-5 py-3 text-sm font-bold text-amber-900 hover:bg-amber-50 disabled:opacity-50">
              Unpublish (return to pending)
            </button>
          )}
          <Link to={'/organizations/' + event.organization_id} className="inline-flex items-center rounded-xl px-2 text-sm font-semibold text-indigo-700 hover:underline">View organization</Link>
        </div>
      </div>
    </article>
  )
}

function ModerationPanel({ adminId }) {
  const [tab, setTab] = useState('pending')
  const [retry, setRetry] = useState(0)
  const [state, setState] = useState({ status: 'loading', events: [] })

  useEffect(() => {
    let active = true
    fetchModerationEvents().then((events) => {
      if (active) setState({ status: 'ready', events })
    }).catch(() => {
      if (active) setState({ status: 'error', events: [] })
    })
    return () => { active = false }
  }, [retry])

  const visible = tab === 'all' ? state.events : state.events.filter((event) => event.approval_status === tab)

  const refresh = () => {
    setState({ status: 'loading', events: [] })
    setRetry((value) => value + 1)
  }

  const onSaved = (updated) => {
    setState((previous) => ({
      ...previous,
      events: previous.events.map((event) => event.id === updated.id ? updated : event),
    }))
  }

  return (
    <main className="space-y-7 pb-10">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-700">Campus publication verification</p>
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Administrator moderation</h1>
        <p className="max-w-2xl text-slate-600">Verify event paperworks and the dean's official approval before publishing. Admins do not replace the university's face-to-face approval process.</p>
      </header>
      <div role="group" aria-label="Filter approval status" className="flex flex-wrap gap-2">
        {tabs.map((name) => (
          <button key={name} type="button" aria-pressed={tab === name} onClick={() => setTab(name)}
            className={'rounded-full px-4 py-2 text-sm font-bold capitalize ' + (tab === name ? 'bg-indigo-700 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-indigo-50')}>
            {name} ({name === 'all' ? state.events.length : state.events.filter(e => e.approval_status === name).length})
          </button>
        ))}
      </div>
      {state.status === 'loading' && <StatusPanel status="loading" />}
      {state.status === 'error' && <StatusPanel status="error" title="Could not load moderation queue" description="Check database migrations and RLS permissions." onRetry={refresh} />}
      {state.status === 'ready' && !visible.length && <StatusPanel status="empty" title="No events in this category" description="New submissions and moderation decisions will appear here." />}
      {state.status === 'ready' && visible.length > 0 && (
        <div className="space-y-5">
          {visible.map((event) => <ReviewCard key={event.id + ':' + event.approval_status} event={event} adminId={adminId} onSaved={onSaved} />)}
        </div>
      )}
    </main>
  )
}

export default function AdminDashboard() {
  return <AdminGate>{(user) => <ModerationPanel adminId={user.id} />}</AdminGate>
}
