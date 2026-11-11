import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchOrganizerContext } from '../services/organizerEvents'

function GateMessage({ title, detail, action }) {
  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{detail}</p>
      {action}
    </section>
  )
}

const actionClass = 'mt-5 inline-flex rounded-xl bg-indigo-700 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-800'

export default function OrganizerGate({ children }) {
  const [retry, setRetry] = useState(0)
  const [state, setState] = useState({ status: 'loading', retry: 0 })

  useEffect(() => {
    let active = true
    fetchOrganizerContext()
      .then((context) => {
        if (!active) return
        let status = 'ready'
        if (!context.signedIn) status = 'signed-out'
        else if (!['organizer', 'admin'].includes(context.profile?.role)) status = 'forbidden'
        else if (!context.organizations.length) status = 'no-org'
        setState({ status, context, retry })
      })
      .catch(() => { if (active) setState({ status: 'error', retry }) })
    return () => { active = false }
  }, [retry])

  if (state.retry !== retry || state.status === 'loading') {
    return (
      <div aria-busy="true" aria-label="Loading organizer portal" className="space-y-4 animate-pulse">
        <div className="h-8 w-56 rounded bg-slate-200" />
        <div className="h-24 rounded-2xl bg-slate-200" />
        <div className="h-32 rounded-2xl bg-slate-200" />
      </div>
    )
  }
  if (state.status === 'signed-out') return (
    <GateMessage title="Sign in to manage events" detail="This area is for authorized student organization representatives."
      action={<Link to={'/sign-in?next=' + encodeURIComponent('/organizer')} className={actionClass}>Sign in</Link>} />
  )
  if (state.status === 'forbidden') return (
    <GateMessage title="Organizer access required" detail="This account is not assigned an organizer role. An administrator must authorize your account."
      action={<Link to="/" className={actionClass}>Back to dashboard</Link>} />
  )
  if (state.status === 'no-org') return (
    <GateMessage title="No organization assigned" detail="Your account has an organizer/admin role but does not own an organization yet. Ask an administrator to assign one before creating events."
      action={<Link to="/organizations" className={actionClass}>Browse organizations</Link>} />
  )
  if (state.status === 'error') return (
    <GateMessage title="Organizer portal unavailable" detail="Could not verify your account or organizations. Check the Supabase permissions and try again."
      action={<button type="button" onClick={() => setRetry((n) => n + 1)} className={actionClass}>Try again</button>} />
  )
  return children(state.context)
}
