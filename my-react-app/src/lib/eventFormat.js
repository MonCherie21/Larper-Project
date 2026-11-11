// Display all campus event dates in Philippine time for consistent results.
const ZONE = 'Asia/Manila'

export const EVENT_CATEGORIES = [
  'Academic',
  'Sports',
  'Technology',
  'Arts & Culture',
  'Social Activities',
  'Competitions',
]

export function displayCategory(value) {
  const category = (value || 'Campus Activity').trim()
  if (category.toLowerCase() === 'competition') return 'Competitions'
  if (category.toLowerCase() === 'arts') return 'Arts & Culture'
  return category
}

export function dateLabel(value) {
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: ZONE, month: 'short', day: 'numeric', year: 'numeric',
  }).format(new Date(value))
}

export function dayLabel(value) {
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: ZONE, month: 'short', day: 'numeric',
  }).format(new Date(value))
}

export function timeLabel(value) {
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: ZONE, hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(new Date(value))
}

export function eventRange(event) {
  const start = dateLabel(event.start_time)
  const end = dateLabel(event.end_time)
  return start === end
    ? start + ' · ' + timeLabel(event.start_time) + '–' + timeLabel(event.end_time)
    : start + ', ' + timeLabel(event.start_time) + ' – ' + end + ', ' + timeLabel(event.end_time)
}

export function eventMatches(event, query) {
  const needle = query.toLocaleLowerCase().trim()
  if (!needle) return true
  return [
    event.title, event.description, event.category, event.location,
    event.organizations?.name,
  ].some((value) => (value || '').toLocaleLowerCase().includes(needle))
}
