import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EventCard from '../components/EventCard'
import StatusPanel from '../components/StatusPanel'
import { useAuth } from '../hooks/useAuth'
import { fetchBookmarkedEvents } from '../services/student'

export default function Bookmarks() {
  const { user, loading, configured } = useAuth()
  const [retry, setRetry] = useState(0)
  const [state, setState] = useState({ status: 'loading', userId: null, events: [] })

  useEffect(() => {
    if (!user?.id) return undefined
    let active = true
    fetchBookmarkedEvents(user.id)
      .then((events) => { if (active) setState({ status: 'ready', userId: user.id, events }) })
      .catch(() => { if (active) setState({ status: 'error', userId: user.id, events: [] }) })
    return () => { active = false }
  }, [user?.id, retry])

  const refresh = () => {
    setState({ status: 'loading', userId: user?.id, events: [] })
    setRetry((n) => n + 1)
  }
  const viewStatus = state.userId === user?.id ? state.status : 'loading'

  return (
    <div className="space-y-6 py-2 sm:py-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-700">Your campus shortlist</p>
        <h1 className="mt-1 text-3xl font-extrabold text-slate-900 sm:text-4xl">Bookmarked events</h1>
        <p className="mt-2 text-slate-600">Keep track of activities you want to revisit.</p>
      </div>
      {!configured && <StatusPanel status="error" title="Supabase isn't configured" description="Add the required values in your local .env file." />}
      {configured && loading && <StatusPanel status="loading" />}
      {configured && !loading && !user && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h2 className="text-xl font-bold">Sign in to see your bookmarks</h2>
          <p className="mt-2 text-sm text-slate-600">You can browse all events without an account. Sign in to save them for later.</p>
          <Link to={'/sign-in?next=' + encodeURIComponent('/bookmarks')} className="mt-5 inline-block rounded-xl bg-indigo-700 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-800">Sign in</Link>
        </div>
      )}
      {configured && !loading && user && viewStatus === 'loading' && <StatusPanel status="loading" />}
      {configured && !loading && user && viewStatus === 'error' && <StatusPanel status="error" title="Couldn't load bookmarks" description="Try again after checking the Supabase permissions." onRetry={refresh} />}
      {configured && !loading && user && viewStatus === 'ready' && state.events.length === 0 && (
        <div>
          <StatusPanel status="empty" title="No saved events yet" description="Open any approved event and select Save to bookmarks." />
          <Link to="/events" className="mt-4 inline-block text-sm font-bold text-indigo-700 hover:underline">Browse upcoming events →</Link>
        </div>
      )}
      {configured && !loading && user && viewStatus === 'ready' && state.events.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {state.events.map((event) => <EventCard key={event.id} event={event} />)}
        </div>
      )}
    </div>
  )
}
