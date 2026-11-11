import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EventCard from './EventCard'
import StatusPanel from './StatusPanel'
import { useAuth } from '../hooks/useAuth'
import { fetchRecommendations } from '../services/recommendations'

export default function RecommendedSection() {
  const { user, loading } = useAuth()
  const [state, setState] = useState({ userId: null, status: 'loading' })

  useEffect(() => {
    if (!user?.id) return undefined
    let live = true
    fetchRecommendations(user.id)
      .then(data => { if (live) setState({ userId: user.id, status: 'ready', ...data }) })
      .catch(() => { if (live) setState({ userId: user.id, status: 'error' }) })
    return () => { live = false }
  }, [user?.id])

  if (loading) return null
  if (!user) return (
    <section className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
      <h2 className="text-2xl font-bold text-slate-900">Discover events made for your interests</h2>
      <p className="mt-2 text-sm text-slate-600">Sign in and set your preferences to see personalized recommendations. You can still browse every approved campus event without an account.</p>
      <Link to="/sign-in" className="mt-4 inline-block text-sm font-bold text-indigo-700 hover:underline">Sign in →</Link>
    </section>
  )

  const status = state.userId === user.id ? state.status : 'loading'
  return (
    <section className="space-y-5" aria-labelledby="recommendations-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-700">Based on your interests</p>
          <h2 id="recommendations-heading" className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">Recommended for you</h2>
        </div>
        <Link to="/preferences" className="text-sm font-semibold text-indigo-700 hover:underline">Update preferences →</Link>
      </div>
      {status === 'loading' && <StatusPanel status="loading" />}
      {status === 'error' && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">Recommendations aren't available right now. You can still explore all campus events.</p>}
      {status === 'ready' && !(state.events?.length || state.organizations?.length) && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-600">No strong matches yet. Add interests or explore events across the university.</p>
          <Link to="/preferences" className="mt-3 inline-block text-sm font-bold text-indigo-700 hover:underline">Set your interests →</Link>
        </div>
      )}
      {status === 'ready' && Boolean(state.events?.length) && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {state.events.map(event => (
            <div key={event.id} className="flex flex-col gap-2">
              <p className="min-h-8 text-xs font-semibold text-indigo-700">✦ {event.recommendation.reason}</p>
              <EventCard event={event} />
            </div>
          ))}
        </div>
      )}
      {status === 'ready' && Boolean(state.organizations?.length) && (
        <div>
          <h3 className="mb-3 text-lg font-bold text-slate-900">Organizations you may like</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {state.organizations.map(org => (
              <Link to={'/organizations/' + org.id} key={org.id} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-indigo-300">
                <h4 className="font-bold text-slate-900">{org.name}</h4>
                <p className="mt-1 text-xs text-indigo-700">{org.recommendation.reason}</p>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{org.description}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
      <p className="text-xs text-slate-500">These are suggestions, not eligibility decisions. Academic schedules aren't used because timetable data is unavailable.</p>
    </section>
  )
}
