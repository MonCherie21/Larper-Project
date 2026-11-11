import { supabase } from '../lib/supabase'

export async function savePreferences(userId, values) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const payload = {
    academic_program: values.academic_program.trim() || null,
    interests: values.interests.trim() || null,
    preferred_categories: values.preferred_categories,
    extracurricular_interests: values.extracurricular_interests
      .split(',').map(x => x.trim()).filter(Boolean).slice(0, 15),
  }
  const { data, error } = await supabase.from('profiles').update(payload).eq('id', userId)
    .select('academic_program,interests,preferred_categories,extracurricular_interests').maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Could not save your preferences.')
  return data
}
