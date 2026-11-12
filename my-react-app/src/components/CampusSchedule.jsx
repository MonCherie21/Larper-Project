import { useState } from 'react'
import { Link } from 'react-router-dom'
import UiIcon from './UiIcon'
import { dateLabel, dayLabel, timeLabel, displayCategory } from '../lib/eventFormat'

// Display and group campus dates consistently in Philippine time.
const phParts = new Intl.DateTimeFormat('en-PH', {
  timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
})
export function philippinesDay(value) {
  const date = new Date(value)
  const parts = Object.fromEntries(phParts.formatToParts(date).map(part => [part.type, part.value]))
  return [parts.year, parts.month, parts.day].join('-')
}
function dateKey(year, month, day) {
  return [year, String(month + 1).padStart(2, '0'), String(day).padStart(2, '0')].join('-')
}
const weekdayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function EventCalendar({ events, selectedDay, onSelect }) {
  const [cursor, setCursor] = useState(() => new Date())
  const [today] = useState(() => philippinesDay(new Date()))
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay()
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const monthTitle = new Intl.DateTimeFormat('en-PH', {
    month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month, 1)))
  const counts = events.reduce((result, event) => {
    const key = philippinesDay(event.start_time)
    result[key] = (result[key] || 0) + 1
    return result
  }, {})
  function moveMonth(delta) {
    setCursor(new Date(year, month + delta, 1))
    onSelect(null)
  }

  return (
    <section aria-labelledby="campus-calendar-heading" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-2">
        <h2 id="campus-calendar-heading" className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <UiIcon name="calendar" className="h-5 w-5 text-indigo-700" /> Calendar
        </h2>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Previous month" onClick={() => moveMonth(-1)}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100">
            <UiIcon name="chevronLeft" />
          </button>
          <span className="min-w-30 text-center text-sm font-semibold text-slate-800">{monthTitle}</span>
          <button type="button" aria-label="Next month" onClick={() => moveMonth(1)}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100">
            <UiIcon name="chevronRight" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekdayNames.map((day, index) => (
          <span key={index} className="pb-2 text-xs font-semibold text-slate-400">{day}</span>
        ))}
        {Array.from({ length: firstWeekday }, (_, index) => <span key={'blank:' + index} />)}
        {Array.from({ length: days }, (_, index) => {
          const day = index + 1
          const key = dateKey(year, month, day)
          const selected = selectedDay === key
          const count = counts[key] || 0
          return (
            <button key={key} type="button" onClick={() => onSelect(selected ? null : key)}
              aria-label={key + ', ' + count + (count === 1 ? ' event' : ' events')}
              aria-pressed={selected}
              className={'relative flex aspect-square min-h-9 flex-col items-center justify-center rounded-xl text-sm font-medium transition ' +
                (selected ? 'bg-indigo-700 text-white' : key === today
                  ? 'bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200'
                  : 'text-slate-700 hover:bg-slate-100')}>
              {day}
              {count > 0 && <span aria-hidden="true" className={'absolute bottom-1 h-1 w-1 rounded-full ' + (selected ? 'bg-white' : 'bg-indigo-600')} />}
            </button>
          )
        })}
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
        <span><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-indigo-600" />Days with events</span>
        {selectedDay && <button type="button" onClick={() => onSelect(null)}
          className="font-semibold text-indigo-700 hover:underline">Show all dates</button>}
      </div>
    </section>
  )
}

function ScheduleRow({ event }) {
  return (
    <Link
      to={'/events/' + event.id}
      className="group grid gap-3 px-4 py-4 transition-colors hover:bg-indigo-50/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-indigo-600 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,1.05fr)_1.25rem] sm:items-center sm:gap-3 sm:px-5"
    >
      <div className="min-w-0">
        <span className="block font-bold leading-snug text-slate-900 group-hover:text-indigo-700">{event.title}</span>
        <span className="mt-1 block text-xs font-medium text-slate-500">{displayCategory(event.category)}</span>
      </div>
      <p className="min-w-0 text-sm font-medium text-slate-700">
        <span className="inline-flex max-w-full items-center rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-indigo-800">
          <span className="truncate">{event.organizations?.name || 'Campus organizer'}</span>
        </span>
      </p>
      <div className="space-y-1 text-xs leading-relaxed text-slate-600">
        <p><span className="mr-1.5 font-bold text-slate-800">Start:</span>{dateLabel(event.start_time)}, {timeLabel(event.start_time)}</p>
        <p><span className="mr-2 font-bold text-slate-800">End:</span>{dateLabel(event.end_time)}, {timeLabel(event.end_time)}</p>
      </div>
      <UiIcon name="chevronRight" className="hidden h-4 w-4 text-indigo-500 transition group-hover:translate-x-0.5 sm:block" />
    </Link>
  )
}

export default function CampusSchedule({ events }) {
  const [selectedDay, setSelectedDay] = useState(null)
  const chosen = selectedDay ? events.filter(event => philippinesDay(event.start_time) === selectedDay) : events
  const groups = chosen.reduce((acc, event) => {
    const key = philippinesDay(event.start_time)
    if (!acc.length || acc[acc.length - 1].key !== key) acc.push({ key, items: [] })
    acc[acc.length - 1].items.push(event)
    return acc
  }, [])

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <EventCalendar events={events} selectedDay={selectedDay} onSelect={setSelectedDay} />
      <section aria-labelledby="upcoming-events-heading" className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div>
            <h2 id="upcoming-events-heading" className="text-lg font-bold text-slate-900">Upcoming events</h2>
            <p className="mt-0.5 text-xs text-slate-500">{selectedDay ? dayLabel(selectedDay + 'T12:00:00+08:00') : 'Sorted by start date'} · {chosen.length} {chosen.length === 1 ? 'event' : 'events'}</p>
          </div>
          <Link to="/events" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:underline">
            View all <UiIcon name="arrowRight" />
          </Link>
        </div>
        {groups.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No upcoming events {selectedDay ? 'on this date.' : 'yet.'}</div>
        ) : (
          <div className="max-h-135 space-y-3 overflow-y-auto bg-slate-50/70 p-3 sm:p-4">
            {groups.map(group => (
              <section key={group.key} aria-label={'Events for ' + dateLabel(group.items[0].start_time)}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 bg-indigo-50/90 px-4 py-3 sm:px-5">
                  <span className="flex items-center gap-2 text-sm font-bold text-indigo-900">
                    <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                    {dateLabel(group.items[0].start_time)}
                  </span>
                  <span className="rounded-full border border-indigo-200 bg-white px-2.5 py-1 text-xs font-semibold text-indigo-700">
                    {group.items.length} {group.items.length === 1 ? 'event' : 'events'}
                  </span>
                </div>
                <div className="divide-y divide-slate-200">
                  {group.items.map(event => <ScheduleRow key={event.id} event={event} />)}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
