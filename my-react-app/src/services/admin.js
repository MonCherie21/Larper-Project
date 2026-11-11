import { supabase } from '../lib/supabase'

const FIELDS = 'id,title,description,category,location,start_time,end_time,poster_url,approval_status,organization_id,paperwork_verified,dean_approved,rejection_reason,reviewed_at,organizations(id,name,owner_id)'

function client() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

function unpack({ data, error }) {
  if (error) throw error
  return data
}

export async function fetchAdminRole() {
  const { data: { user }, error } = await client().auth.getUser()
  if (error || !user) return { user: null, authorized: false }
  const profile = unpack(await client().from('profiles').select('role').eq('id', user.id).maybeSingle())
  return { user, authorized: profile?.role === 'admin' }
}

export async function fetchModerationEvents() {
  return unpack(await client().from('events').select(FIELDS).order('start_time', { ascending: false })) ?? []
}

export async function moderateEvent(event, decision, paperwork, dean, reason) {
  if (!['approved', 'rejected', 'pending'].includes(decision)) throw new Error('Invalid moderation action.')
  if (decision === 'approved' && (!paperwork || !dean)) throw new Error('Verify both paperworks and dean approval.')
  if (decision === 'rejected' && !reason.trim()) throw new Error('Provide a reason for rejection.')
  const fields = {
    approval_status: decision,
    paperwork_verified: decision === 'approved' && paperwork,
    dean_approved: decision === 'approved' && dean,
    rejection_reason: decision === 'rejected' ? reason.trim() : null,
  }
  const response = await client().from('events').update(fields)
    .eq('id', event.id).eq('approval_status', event.approval_status)
    .select(FIELDS).maybeSingle()
  const updated = unpack(response)
  if (!updated) throw new Error('This event was changed by another reviewer. Refresh and try again.')
  return updated
}
