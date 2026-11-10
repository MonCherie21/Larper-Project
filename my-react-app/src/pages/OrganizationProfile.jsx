import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CategoryBadge, OrgLogo } from '../components/OrganizationCard'
import {
  fetchOrganization,
  fetchOrganizationEvents,
  fetchOrganizerName,
} from '../services/organizations'

function Breadcrumb({ current }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
      <Link to="/" className="hover:text-indigo-700 hover:underline">
        Dashboard
      </Link>
      <span className="mx-2" aria-hidden="true">/</span>
      <Link to="/organizations" className="hover:text-indigo-700 hover:underline">
        Organizations
      </Link>
      {current && (
        <>
          <span className="mx-2" aria-hidden="true">/</span>
          <span className="text-slate-900">{current}</span>
        </>
      )}
    </nav>
  )
}

function EventRow({ event, muted = false }) {
  const start = new Date(event.start_time)
  const when = `${start.toLocaleDateString(undefined, { weekday: 'short' })}, ${start.toLocaleTimeString(
    undefined,
    { hour: 'numeric', minute: '2-digit' },
  )}`

  return (
    <li className="flex gap-4 py-4">
      <div className={`w-14 shrink-0 text-center ${muted ? 'text-slate-500' : 'text-indigo-800'}`}>
        <div className="text-sm font-medium">
          {start.toLocaleDateString(undefined, { month: 'short' })}
        </div>
        <div className="text-2xl font-bold leading-none">{start.getDate()}</div>
      </div>
      <div className="min-w-0">
        <h3 className="font-semibold text-slate-900">{event.title}</h3>
        <p className="mt-0.5 text-sm text-slate-600">
          {when}
          {event.location ? `, ${event.location}` : ''}
        </p>
        {event.category && <p className="mt-1 text-sm text-slate-500">{event.category}</p>}
      </div>
    </li>
  )
}

function ProfileSkeleton() {
  return (
    <div className="mt-8 animate-pulse" aria-busy="true">
      <div className="flex items-center gap-5">
        <div className="h-20 w-20 rounded-xl bg-slate-200" />
        <div className="flex-1 space-y-3">
          <div className="h-7 w-1/2 rounded bg-slate-200" />
          <div className="h-4 w-1/4 rounded bg-slate-200" />
        </div>
      </div>
      <div className="mt-8 space-y-2">
        <div className="h-3 rounded bg-slate-200" />
        <div className="h-3 w-5/6 rounded bg-slate-200" />
        <div className="h-3 w-2/3 rounded bg-slate-200" />
      </div>
    </div>
  )
}

export default function OrganizationProfile() {
  const { id } = useParams()
  const [state, setState] = useState({ status: 'loading' }) // loading | ready | error
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    Promise.all([fetchOrganization(id), fetchOrganizationEvents(id), fetchOrganizerName(id)])
      .then(([org, events, organizer]) => {
        if (!cancelled) setState({ status: 'ready', org, events, organizer })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [id, attempt])

  if (state.status === 'loading') {
    return (
      <div className="mx-auto max-w-3xl py-2 sm:py-4">
        <Breadcrumb />
        <ProfileSkeleton />
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="mx-auto max-w-3xl py-2 sm:py-4">
        <Breadcrumb />
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <h1 className="text-lg font-semibold text-slate-900">Couldn’t load this organization</h1>
          <p className="mt-1 text-sm text-slate-600">Check your connection and try again.</p>
          <button
            type="button"
            onClick={() => setAttempt((a) => a + 1)}
            className="mt-5 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  const { org, events, organizer } = state

  if (!org) {
    return (
      <div className="mx-auto max-w-3xl py-2 sm:py-4">
        <Breadcrumb />
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <h1 className="text-lg font-semibold text-slate-900">Organization not found</h1>
          <p className="mt-1 text-sm text-slate-600">
            It may have been removed, or the link is incorrect.
          </p>
          <Link
            to="/organizations"
            className="mt-5 inline-block rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800"
          >
            Browse all organizations
          </Link>
        </div>
      </div>
    )
  }

  // Events arrive sorted by start_time (oldest first).
  const now = Date.now()
  const upcoming = events.filter((e) => new Date(e.end_time).getTime() >= now)
  const recent = events
    .filter((e) => new Date(e.end_time).getTime() < now)
    .reverse()
    .slice(0, 6)

  return (
    <div className="mx-auto max-w-3xl py-2 sm:py-4">
      <Breadcrumb current={org.name} />

      <header className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
        <OrgLogo org={org} className="h-20 w-20 text-2xl" />
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{org.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <CategoryBadge category={org.category} />
            {organizer && <span className="text-sm text-slate-600">Organized by {organizer}</span>}
          </div>
        </div>
      </header>

      <section className="mt-10" aria-labelledby="about-heading">
        <h2 id="about-heading" className="text-xl font-semibold text-slate-900">
          About
        </h2>
        <p className="mt-2 max-w-prose whitespace-pre-line leading-relaxed text-slate-700">
          {org.description || 'This organization hasn’t added a description yet.'}
        </p>
      </section>

      <section className="mt-10" aria-labelledby="upcoming-heading">
        <h2 id="upcoming-heading" className="text-xl font-semibold text-slate-900">
          Upcoming events
        </h2>
        {upcoming.length === 0 ? (
          <p className="mt-2 text-slate-600">No upcoming events right now. Check back soon.</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-200">
            {upcoming.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </ul>
        )}
      </section>

      {recent.length > 0 && (
        <section className="mt-10" aria-labelledby="recent-heading">
          <h2 id="recent-heading" className="text-xl font-semibold text-slate-900">
            Recent activities
          </h2>
          <ul className="mt-2 divide-y divide-slate-200">
            {recent.map((event) => (
              <EventRow key={event.id} event={event} muted />
            ))}
          </ul>
        </section>
      )}

      <div className="mt-12">
        <Link
          to="/organizations"
          className="text-sm font-medium text-indigo-700 hover:text-indigo-800 hover:underline"
        >
          Back to all organizations
        </Link>
      </div>
    </div>
  )
}