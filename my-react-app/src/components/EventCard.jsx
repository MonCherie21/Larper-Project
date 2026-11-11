import { useState } from 'react'
import { Link } from 'react-router-dom'
import { dayLabel, displayCategory, eventRange } from '../lib/eventFormat'

export function EventPoster({ event, className = '' }) {
  const [failed, setFailed] = useState(false)

  return (
    <div className={'relative isolate overflow-hidden bg-indigo-100 ' + className}>
      {event.poster_url && !failed ? (
        <img
          src={event.poster_url}
          alt={'Poster for ' + event.title}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-600 to-sky-500 p-6 text-white">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full border border-white/20" />
          <div className="absolute -bottom-20 -left-12 h-52 w-52 rounded-full border border-white/20" />
          <div className="relative flex max-w-xs flex-col items-center gap-3 text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" className="h-10 w-10 opacity-90">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M7 3v4M17 3v4M3 10h18M8 14h3M8 18h6" />
            </svg>
            <p className="line-clamp-3 text-lg font-bold leading-snug tracking-tight sm:text-xl">{event.title}</p>
            <span className="text-xs font-medium uppercase tracking-widest text-indigo-100">{displayCategory(event.category)}</span>
          </div>
        </div>
      )}
      <span className="absolute bottom-3 left-3 rounded-lg bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-900 shadow-sm">
        {dayLabel(event.start_time)}
      </span>
    </div>
  )
}

export default function EventCard({ event, featured = false }) {
  return (
    <Link
      to={'/events/' + event.id}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
    >
      <EventPoster event={event} className={featured ? 'h-48 w-full' : 'h-40 w-full'} />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <span className="w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{displayCategory(event.category)}</span>
        <h3 className="line-clamp-2 text-lg font-bold leading-snug text-slate-900 group-hover:text-indigo-700">{event.title}</h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">{event.description || 'Discover what is happening around your campus.'}</p>
        <div className="mt-auto space-y-1.5 border-t border-slate-100 pt-3 text-sm text-slate-600">
          <p className="flex items-start gap-2">
            <span aria-hidden="true" className="text-indigo-600">◷</span>
            <span>{eventRange(event)}</span>
          </p>
          <p className="flex items-start gap-2">
            <span aria-hidden="true" className="text-indigo-600">⌖</span>
            <span>{event.location || 'Venue to be announced'}</span>
          </p>
          <p className="truncate font-medium text-slate-800">{event.organizations?.name || 'Campus organizer'}</p>
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-bold text-indigo-700">View event details <span aria-hidden="true">→</span></span>
      </div>
    </Link>
  )
}
