export default function StatusPanel({
  status,
  title = 'Nothing to show yet',
  description = '',
  onRetry,
}) {
  if (status === 'loading') {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading events" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="h-44 bg-indigo-100" />
            <div className="space-y-3 p-5">
              <div className="h-4 w-24 rounded bg-slate-200" />
              <div className="h-5 w-3/4 rounded bg-slate-200" />
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-2/3 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div role={status === 'error' ? 'alert' : 'status'} className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-xl text-indigo-600" aria-hidden="true">
        {status === 'error' ? '!' : '○'}
      </div>
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">{description}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-5 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800">
          Try again
        </button>
      )}
    </div>
  )
}
