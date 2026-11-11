import { supabase } from '../lib/supabase'
import { fetchUpcomingEvents } from './events'
import { fetchOrganizations } from './organizations'
import { rankRecommendations } from '../lib/recommendations'

export async function fetchRecommendations(userId) {
  const [events, organizations, profileResult] = await Promise.all([
    fetchUpcomingEvents(),
    fetchOrganizations(),
    supabase.from('profiles').select(
      'academic_program,interests,preferred_categories,extracurricular_interests'
    ).eq('id', userId).maybeSingle(),
  ])
  if (profileResult.error) throw profileResult.error
  const profile = profileResult.data
  return {
    profile,
    events: profile ? rankRecommendations(events, profile, 'event').slice(0, 3) : [],
    organizations: profile ? rankRecommendations(organizations, profile, 'organization').slice(0, 3) : [],
  }
}
