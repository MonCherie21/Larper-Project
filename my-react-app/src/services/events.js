import { supabase } from '../lib/supabase'

export const EVENT_FIELDS =
  'id,title,description,category,location,start_time,end_time,poster_url,organization_id,' +
  'organizations(id,name,logo_url)'

function client() {
  if (!supabase) throw new Error('Supabase is not configured. Check your .env file.')
  return supabase
}

// Only approved, unfinished events are shown in the discovery feeds.
export async function fetchUpcomingEvents() {
  const { data, error } = await client()
    .from('events')
    .select(EVENT_FIELDS)
    .eq('approval_status', 'approved')
    .gte('end_time', new Date().toISOString())
    .order('start_time', { ascending: true })

  if (error) throw error
  return data ?? []
}

// The detail route must not disclose pending/rejected events even if someone knows an ID.
export async function fetchEventDetails(id) {
  const { data, error } = await client()
    .from('events')
    .select(EVENT_FIELDS)
    .eq('id', id)
    .eq('approval_status', 'approved')
    .maybeSingle()

  if (error) throw error
  return data
}
