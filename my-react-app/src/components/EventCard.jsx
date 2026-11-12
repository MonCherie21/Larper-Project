import { useState } from 'react'
import { Link } from 'react-router-dom'
import UiIcon from './UiIcon'
import { dateLabel, dayLabel, displayCategory, timeLabel } from '../lib/eventFormat'

export function EventPoster({ event, className = '' }) {
  const [failed, setFailed] = useState(false)

  return (
    <div className={'relative isolate overflow-hidden bg-indigo-50 ' + className}>
      {event.poster_url && !failed ? (
        <img src={event.poster_url} alt={'Poster for ' + event.title} loading="lazy"
          onError={() => setFailed(true)} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-indigo-100 text-indigo-700">
          <UiIcon name="calendar" className="h-10 w-10 stroke-[1.3]" />
          <span className="text-xs font-semibold tracking-wide text-indigo-500">CAMPUS EVENT</span>
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
    <Link to={'/events/' + event.id}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
      <EventPoster event={event} className={featured ? 'h-48 w-full' : 'h-44 w-full'} />
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="space-y-1.5">
          <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">{displayCategory(event.category)}</span>
          <h3 className="line-clamp-2 text-lg font-bold leading-snug text-slate-900 group-hover:text-indigo-700">{event.title}</h3>
        </div>
        {event.description && <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">{event.description}</p>}
        <div className="mt-auto space-y-2.5 border-t border-slate-100 pt-3 text-sm">
          <div className="flex items-start gap-2.5">
            <UiIcon name="calendar" className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
            <div className="min-w-0 space-y-0.5 text-xs text-slate-600">
              <p><span className="font-semibold text-slate-800">Start:</span> {dateLabel(event.start_time)} · {timeLabel(event.start_time)}</p>
              <p><span className="font-semibold text-slate-800">End:</span> {dateLabel(event.end_time)} · {timeLabel(event.end_time)}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 text-slate-600">
            <UiIcon name="mapPin" className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
            <span className="line-clamp-1 text-sm">{event.location || 'Venue to be announced'}</span>
          </div>
          <div className="flex items-start gap-2.5 text-slate-700">
            <UiIcon name="users" className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
            <span className="line-clamp-1 text-sm font-medium">{event.organizations?.name || 'Campus organizer'}</span>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 pt-0.5 text-sm font-semibold text-indigo-700">
          View event <UiIcon name="arrowRight" className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}
