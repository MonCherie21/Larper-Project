const STYLES = {
  pending: 'bg-amber-50 text-amber-800 ring-amber-200',
  approved: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  rejected: 'bg-rose-50 text-rose-800 ring-rose-200',
}
const LABELS = { pending: 'Pending approval', approved: 'Approved', rejected: 'Rejected' }

export default function StatusBadge({ status }) {
  return (
    <span className={'inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ' + (STYLES[status] || STYLES.pending)}>
      {LABELS[status] || 'Pending approval'}
    </span>
  )
}
