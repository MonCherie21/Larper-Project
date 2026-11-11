import { displayCategory } from './eventFormat'

// Simple adjustable heuristic (not a machine-learning model).
// There is no academic timetable, so the 20% schedule factor is omitted.
// The remaining factors are normalized to 62.5% interests / 37.5% program.
export const RECOMMENDATION_WEIGHTS = Object.freeze({ interests: 0.5, program: 0.3, schedule: 0.2 })
export const EFFECTIVE_WEIGHTS = Object.freeze({
  interests: RECOMMENDATION_WEIGHTS.interests / (RECOMMENDATION_WEIGHTS.interests + RECOMMENDATION_WEIGHTS.program),
  program: RECOMMENDATION_WEIGHTS.program / (RECOMMENDATION_WEIGHTS.interests + RECOMMENDATION_WEIGHTS.program),
})

function tokens(value) {
  const text = Array.isArray(value) ? value.join(' ') : String(value || '')
  return new Set(text.toLowerCase().split(/[^a-z0-9]+/).filter(word => word.length >= 3))
}

function matchingTerms(needles, haystack) {
  return [...needles].filter(term => haystack.has(term))
}

export function recommendationScore(item, profile, kind = 'event') {
  const preferences = [
    ...(profile.interests || '').split(','),
    ...(profile.extracurricular_interests || []),
    ...(profile.preferred_categories || []),
  ]
  const interests = tokens(preferences)
  const mainCategory = displayCategory(item.category)
  const text = kind === 'event'
    ? [item.title, item.description, mainCategory, item.organizations?.name].join(' ')
    : [item.name, item.description, mainCategory].join(' ')
  const searchable = tokens(text)
  const shared = matchingTerms(interests, searchable)

  const interestScore = interests.size ? shared.length / interests.size : 0
  const program = (profile.academic_program || '').toLowerCase()
  const category = mainCategory.toLowerCase()
  const techProgram = /computer|information technology|software|engineering|computing|data|bscs|bsit/.test(program)
  const educationProgram = /education|teaching|teacher|b[e]ed|bsed|cte/.test(program)
  const programMatched = Boolean(program) && (
    (techProgram && /technology|academic|competition|robotics|programming|hackathon/.test(category + ' ' + text.toLowerCase())) ||
    (educationProgram && /academic|education|teaching|literacy|seminar/.test(category + ' ' + text.toLowerCase())) ||
    (tokens(program).size > 0 && matchingTerms(tokens(program), searchable).length > 0)
  )
  const score = EFFECTIVE_WEIGHTS.interests * interestScore + EFFECTIVE_WEIGHTS.program * Number(programMatched)
  let reason = 'Popular campus activity to explore'
  if (shared.length) reason = 'Matches your interests: ' + shared.slice(0, 3).join(', ')
  else if (programMatched) reason = 'Relevant to your academic program'
  return { score, reason }
}

export function rankRecommendations(items, profile, kind = 'event') {
  return items.map(item => ({ ...item, recommendation: recommendationScore(item, profile, kind) }))
    .filter(item => item.recommendation.score > 0)
    .sort((a, b) => b.recommendation.score - a.recommendation.score ||
      (kind === 'event'
        ? new Date(a.start_time) - new Date(b.start_time)
        : String(a.name).localeCompare(String(b.name))))
}
