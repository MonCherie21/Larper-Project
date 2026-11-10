import { useState } from 'react'
import { Link } from 'react-router-dom'

// One tint per category so groups are easy to tell apart at a glance, even
// when an organization hasn't uploaded a logo. Full class names so Tailwind
// can detect them.
const CATEGORY_STYLES = {
  Academic: { tile: 'bg-sky-100 text-sky-800', badge: 'bg-sky-50 text-sky-800 ring-sky-200' },
  Sports: { tile: 'bg-orange-100 text-orange-800', badge: 'bg-orange-50 text-orange-800 ring-orange-200' },
  Arts: { tile: 'bg-rose-100 text-rose-800', badge: 'bg-rose-50 text-rose-800 ring-rose-200' },
  Technology: { tile: 'bg-violet-100 text-violet-800', badge: 'bg-violet-50 text-violet-800 ring-violet-200' },
  Cultural: { tile: 'bg-amber-100 text-amber-800', badge: 'bg-amber-50 text-amber-800 ring-amber-200' },
  'Special Interest': { tile: 'bg-emerald-100 text-emerald-800', badge: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
}
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