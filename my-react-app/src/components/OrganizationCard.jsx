import { useState } from 'react'
import { Link } from 'react-router-dom'

// One tint per category so groups are easy to tell apart at a glance, even
// when an organization hasn't uploaded a logo. Full class names so Tailwind
// can detect them.
// One restrained visual language across all club types; category remains textual.
const CATEGORY_STYLES = Object.fromEntries(
  ['Academic', 'Sports', 'Arts', 'Technology', 'Cultural', 'Special Interest'].map(category => [
    category,
    { tile: 'bg-indigo-50 text-indigo-800', badge: 'bg-slate-50 text-slate-700 ring-slate-200' },
  ]),
)
const FALLBACK_STYLE = {
  tile: 'bg-slate-100 text-slate-700',
  badge: 'bg-slate-50 text-slate-700 ring-slate-200',
}

const categoryStyle = (category) => CATEGORY_STYLES[category] ?? FALLBACK_STYLE

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

// Logo image, or a tinted initials tile when there's no logo or it fails to load.
export function OrgLogo({ org, className = 'h-14 w-14 text-lg' }) {
  const [broken, setBroken] = useState(false)

  if (org.logo_url && !broken) {
    return (
      <img
        src={org.logo_url}
        alt={`${org.name} logo`}
        onError={() => setBroken(true)}
        className={`${className} shrink-0 rounded-xl bg-slate-100 object-cover`}
      />
    )
  }
  return (
    <div
      aria-hidden="true"
      className={`${className} ${categoryStyle(org.category).tile} grid shrink-0 place-items-center rounded-xl font-semibold`}
    >
      {initials(org.name)}
    </div>
  )
}

export function CategoryBadge({ category }) {
  if (!category) return null
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${categoryStyle(category).badge}`}
    >
      {category}
    </span>
  )
}

export default function OrganizationCard({ org, upcomingCount = 0 }) {
  return (
    <Link
      to={`/organizations/${org.id}`}
      className="group flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
    >
      <div className="flex items-start gap-4">
        <OrgLogo org={org} />
        <div className="min-w-0">
          <h3 className="font-semibold leading-snug text-slate-900 group-hover:text-indigo-800">
            {org.name}
          </h3>
          <div className="mt-1.5">
            <CategoryBadge category={org.category} />
          </div>
        </div>
      </div>

      <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">
        {org.description || 'No description yet.'}
      </p>

      {upcomingCount > 0 && (
        <p className="mt-auto text-sm font-medium text-indigo-700">
          {upcomingCount} upcoming {upcomingCount === 1 ? 'event' : 'events'}
        </p>
      )}
    </Link>
  )
}