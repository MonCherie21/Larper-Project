// Feature 08: RFC 5545 iCalendar export without external APIs.
// The UTC clock form ensures correct import regardless of device timezone.
function icsText(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,').replace(/;/g, '\\;')
}
function icsDate(value) {
  return new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}
function foldLine(line) {
  // Fold by UTF-8 byte length to respect 75-octet iCalendar line limits.
  const bytes = new TextEncoder().encode(line)
  if (bytes.length <= 75) return line
  const chunks = []
  let chunk = ''
  let octets = 0
  for (const char of line) {
    const size = new TextEncoder().encode(char).length
    if (octets + size > 75) {
      chunks.push(chunk)
      chunk = ' '
      octets = 1
    }
    chunk += char
    octets += size
  }
  chunks.push(chunk)
  return chunks.join('\r\n')
}
export function generateIcs(event) {
  if (!event?.id || !event?.start_time || !event?.end_time) {
    throw new Error('Event information is incomplete.')
  }
  const fields = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Campus Connect//Campus Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:' + event.id + '@campus-connect',
    'DTSTAMP:' + icsDate(new Date()),
    'DTSTART:' + icsDate(event.start_time),
    'DTEND:' + icsDate(event.end_time),
    'SUMMARY:' + icsText(event.title),
    'DESCRIPTION:' + icsText(event.description || ''),
    'LOCATION:' + icsText(event.location || ''),
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return fields.map(foldLine).join('\r\n') + '\r\n'
}
export function downloadIcs(event) {
  const data = generateIcs(event)
  const filename = String(event.title || 'campus-event')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'campus-event'
  const blob = new Blob([data], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename + '.ics'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
