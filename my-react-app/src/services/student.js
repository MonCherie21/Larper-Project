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
    .select('full_name,email,role,academic_program,interests')
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
    check(await client().from('rsvps').insert({ user_id: userId, event_id: eventId }))
  } else {
    check(await client().from('rsvps').delete().eq('user_id', userId).eq('event_id', eventId))
  }
}

export async function setBookmark(userId, eventId, bookmarked) {
  if (bookmarked) {
    check(await client().from('bookmarks').insert({ user_id: userId, event_id: eventId }))
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
