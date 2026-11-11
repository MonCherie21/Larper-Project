import { supabase } from '../lib/supabase'
import { EVENT_FIELDS } from './events'

function client() {
  if (!supabase) throw new Error('Supabase is not configured. Check your .env file.')
  return supabase
}

function check(result) {
  if (result.error) throw result.error
  return result.data
}

export async function signIn(email, password) {
  return check(await client().auth.signInWithPassword({ email, password }))
}

export async function signUp(fullName, email, password) {
  return check(await client().auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName.trim() } },
  }))
}

export async function signOut() {
  return check(await client().auth.signOut())
}

export async function fetchStudentProfile(userId) {
  const result = await client()
    .from('profiles')
    .select('full_name,email,role,academic_program,interests,preferred_categories,extracurricular_interests')
    .eq('id', userId)
    .maybeSingle()
  return check(result)
}

export async function fetchParticipation(userId, eventId) {
  const [rsvp, bookmark] = await Promise.all([
    client().from('rsvps').select('id').eq('user_id', userId).eq('event_id', eventId).maybeSingle(),
    client().from('bookmarks').select('id').eq('user_id', userId).eq('event_id', eventId).maybeSingle(),
  ])
  check(rsvp)
  check(bookmark)
  return { rsvped: Boolean(rsvp.data), bookmarked: Boolean(bookmark.data) }
}

export async function setRsvp(userId, eventId, rsvped) {
  if (rsvped) {
    // Prevent stale tabs from registering for unapproved or finished events.
    const { data, error } = await client().from('events')
      .select('id,end_time,approval_status').eq('id', eventId).maybeSingle()
    if (error) throw error
    if (!data || data.approval_status !== 'approved' || new Date(data.end_time) <= new Date()) {
      throw new Error('This event is no longer available for RSVP.')
    }
    const inserted = await client().from('rsvps').insert({ user_id: userId, event_id: eventId })
    if (inserted.error && inserted.error.code !== '23505') throw inserted.error
  } else {
    check(await client().from('rsvps').delete().eq('user_id', userId).eq('event_id', eventId))
  }
}

export async function setBookmark(userId, eventId, bookmarked) {
  if (bookmarked) {
    const inserted = await client().from('bookmarks').insert({ user_id: userId, event_id: eventId })
    if (inserted.error && inserted.error.code !== '23505') throw inserted.error
  } else {
    check(await client().from('bookmarks').delete().eq('user_id', userId).eq('event_id', eventId))
  }
}

export async function fetchBookmarkedEvents(userId) {
  const result = await client()
    .from('bookmarks')
    .select('id,created_at,events!inner(' + EVENT_FIELDS + ')')
    .eq('user_id', userId)
    .eq('events.approval_status', 'approved')
    .order('created_at', { ascending: false })
  return (check(result) ?? []).map((item) => item.events).filter(Boolean)
}

export async function fetchPublicRsvpCount(eventId) {
  const { data, error } = await client().rpc('get_event_rsvp_count', { p_event_id: eventId })
  if (error) throw error
  return Number(data) || 0
}
