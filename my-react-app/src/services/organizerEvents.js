import { supabase } from '../lib/supabase'
import { EVENT_CATEGORIES as DISCOVERY_CATEGORIES } from '../lib/eventFormat'
import { ORG_CATEGORIES } from './organizations'

export const EVENT_CATEGORIES = [...new Set([
  ...DISCOVERY_CATEGORIES,
  ...ORG_CATEGORIES,
  'Competition', 'Workshop', 'Meeting',
])]

export const POSTER_BUCKET = 'event-posters'
export const POSTER_MAX_BYTES = 5 * 1024 * 1024
export const POSTER_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const EVENT_COLUMNS = 'id,title,description,category,location,start_time,end_time,organization_id,poster_url,approval_status'

function client() {
  if (!supabase) throw new Error('Supabase is not configured. Check your .env file.')
  return supabase
}

function requireData({ data, error }) {
  if (error) throw error
  return data
}

// UI gating is only a convenience: RLS is the actual security boundary.
export async function fetchOrganizerContext() {
  const { data: { user }, error: authError } = await client().auth.getUser()
  if (authError || !user) return { signedIn: false }

  const [profile, organizations] = await Promise.all([
    client().from('profiles').select('id,full_name,role').eq('id', user.id).maybeSingle(),
    client().from('organizations')
      .select('id,name,description,category,logo_url')
      .eq('owner_id', user.id).order('name'),
  ])
  const profileData = requireData(profile)
  const orgData = requireData(organizations) ?? []
  return { signedIn: true, user, profile: profileData, organizations: orgData }
}

export async function fetchOrganizerEvents(organizationId) {
  const events = requireData(await client().from('events').select(EVENT_COLUMNS)
    .eq('organization_id', organizationId).order('start_time', { ascending: false })) ?? []

  if (!events.length) return []
  // RSVP RLS permits organizers to count RSVPs for their own events only.
  const { data: rsvps, error } = await client().from('rsvps')
    .select('event_id').in('event_id', events.map((event) => event.id))
  if (error) return events.map((event) => ({ ...event, rsvp_count: null }))
  const counts = (rsvps ?? []).reduce((byEvent, { event_id }) => {
    byEvent[event_id] = (byEvent[event_id] ?? 0) + 1
    return byEvent
  }, {})
  return events.map((event) => ({ ...event, rsvp_count: counts[event.id] ?? 0 }))
}

export async function fetchEventForEdit(eventId) {
  const { data, error } = await client().from('events').select(EVENT_COLUMNS)
    .eq('id', eventId).maybeSingle()
  if (error?.code === '22P02') return null
  if (error) throw error
  return data
}

function eventFields(values) {
  return {
    title: values.title.trim(),
    description: values.description.trim() || null,
    category: values.category,
    location: values.location.trim(),
    start_time: new Date(values.start).toISOString(),
    end_time: new Date(values.end).toISOString(),
  }
}

function validateFile(file) {
  if (!POSTER_TYPES.includes(file.type)) throw new Error('Poster must be a JPG, PNG, or WebP image.')
  if (file.size > POSTER_MAX_BYTES) throw new Error('Poster must be 5 MB or smaller.')
  if (file.size === 0) throw new Error('The selected poster file is empty.')
}

async function uploadPoster(organizationId, file) {
  validateFile(file)
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${organizationId}/${crypto.randomUUID()}.${ext}`

  // Supabase's standard storage.upload() sends multipart/form-data. Some
  // hosted Storage deployments have reported a false-positive RLS denial for
  // multipart uploads even when the same user's INSERT policy is valid.
  // Use a raw binary POST with a fresh path and no x-upsert header.
  // This is STILL subject to the existing storage.objects INSERT RLS policy;
  // only the logged-in user's access token and the public client key are used.
  const { data: { session }, error: authError } = await client().auth.getSession()
  if (authError) throw authError
  if (!session?.access_token) throw new Error('Sign in again to upload an event poster.')

  const projectUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, '')
  const publicKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!projectUrl || !publicKey) throw new Error('Supabase is not configured for uploads.')

  const response = await fetch(
    `${projectUrl}/storage/v1/object/${POSTER_BUCKET}/${path}`,
    {
      method: 'POST',
      headers: {
        apikey: publicKey,
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': file.type,
      },
      body: file,
    },
  )

  if (!response.ok) {
    const details = await response.json().catch(() => null)
    const reason = details?.message || details?.error || response.statusText
    throw new Error(`Poster upload failed (HTTP ${response.status}): ${reason}`)
  }

  const { data } = client().storage.from(POSTER_BUCKET).getPublicUrl(path)
  return { path, url: data.publicUrl }
}

async function cleanupPath(path) {
  if (!path) return
  // Best effort; don't turn a successful event save into an error.
  try { await client().storage.from(POSTER_BUCKET).remove([path]) } catch { /* best effort */ }
}

function posterPath(url, organizationId) {
  if (!url) return null
  // Delete only files in this org's folder, from our configured Supabase bucket.
  const { data } = client().storage.from(POSTER_BUCKET).getPublicUrl('')
  const prefix = data.publicUrl.replace(/\/$/, '') + '/'
  if (!url.startsWith(prefix)) return null
  let path
  try { path = decodeURIComponent(url.slice(prefix.length).split('?')[0]) } catch { return null }
  return path.startsWith(`${organizationId}/`) ? path : null
}

export async function createEvent({ organizationId, values, posterFile }) {
  const uploaded = posterFile ? await uploadPoster(organizationId, posterFile) : null
  try {
    const result = await client().from('events')
      .insert({ ...eventFields(values), organization_id: organizationId, poster_url: uploaded?.url ?? null })
      .select('id,approval_status').single()
    return requireData(result)
  } catch (error) {
    if (uploaded) await cleanupPath(uploaded.path)
    throw error
  }
}

export async function updateEvent({ event, values, posterFile, removePoster }) {
  const uploaded = posterFile ? await uploadPoster(event.organization_id, posterFile) : null
  const newPosterUrl = uploaded?.url ?? (removePoster ? null : event.poster_url)
  try {
    const updated = requireData(await client().from('events')
      .update({ ...eventFields(values), poster_url: newPosterUrl })
      .eq('id', event.id).eq('organization_id', event.organization_id)
      .select('id,approval_status').maybeSingle())
    if (!updated) throw new Error('You do not have permission to edit this event.')
    if (newPosterUrl !== event.poster_url) await cleanupPath(posterPath(event.poster_url, event.organization_id))
    return updated
  } catch (error) {
    if (uploaded) await cleanupPath(uploaded.path)
    throw error
  }
}

export async function deleteEvent(event) {
  const result = requireData(await client().from('events').delete()
    .eq('id', event.id).eq('organization_id', event.organization_id).select('id'))
  if (!result?.length) throw new Error('You do not have permission to delete this event.')
  await cleanupPath(posterPath(event.poster_url, event.organization_id))
}

export function friendlyError(error) {
  const message = error?.message || ''
  if (error instanceof TypeError) return 'Could not reach Supabase. Check your internet connection.'
  if (message.startsWith('Poster upload failed')) return message
  if (/bucket not found/i.test(message)) return 'Poster storage is not set up. Run supabase/05_organizer_portal.sql.'
  if (/permission denied|row.level security|not authorized/i.test(message) || error?.code === '42501') {
    return 'You do not have permission to perform this action. Check your account and database policies.'
  }
  if (error?.code === '23514') return 'The event end time must be after its start time.'
  return message || 'Something went wrong. Please try again.'
}
