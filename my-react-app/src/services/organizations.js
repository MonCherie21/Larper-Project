// Feature 04 - organization directory data access.
import { supabase } from '../lib/supabase'

// Free-text in the DB (organizations.category), so this list only drives the filter chips.
function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured. Check your .env file.')
  return supabase
}

export const ORG_CATEGORIES = [
  'Academic',
  'Sports',
  'Arts',
  'Technology',
  'Cultural',
  'Special Interest',
]

export async function fetchOrganizations() {
  const { data, error } = await requireClient()
    .from('organizations')
    .select('id, name, description, category, logo_url')
    .order('name')
  if (error) throw error
  return data
}

// { [organization_id]: number of approved events that haven't ended yet }.
// A failure here only hides the counts, it should never break the directory.
export async function fetchUpcomingEventCounts() {
  const { data, error } = await requireClient()
    .from('events')
    .select('organization_id')
    .eq('approval_status', 'approved')
    .gte('end_time', new Date().toISOString())
  if (error) return {}
  return data.reduce((counts, e) => {
    counts[e.organization_id] = (counts[e.organization_id] ?? 0) + 1
    return counts
  }, {})
}

// Returns null when the organization doesn't exist.
export async function fetchOrganization(id) {
  const { data, error } = await requireClient()
    .from('organizations')
    .select('id, name, description, category, logo_url')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

// Approved events only. RLS also lets an organization's owner see their own
// pending events, so the explicit filter keeps drafts off the public profile.
export async function fetchOrganizationEvents(organizationId) {
  const { data, error } = await requireClient()
    .from('events')
    .select('id, title, category, location, start_time, end_time')
    .eq('organization_id', organizationId)
    .eq('approval_status', 'approved')
    .order('start_time')
  if (error) throw error
  return data
}

// Organizer's display name only. profiles is private under RLS, so this reads
// the public view from supabase/02b_security_fixes.sql. If the view hasn't been
// created yet, the profile page simply omits the "Organized by" line.
export async function fetchOrganizerName(organizationId) {
  const { data, error } = await requireClient()
    .from('organization_organizers')
    .select('organizer_name')
    .eq('organization_id', organizationId)
    .maybeSingle()
  if (error) return null
  return data?.organizer_name || null
}