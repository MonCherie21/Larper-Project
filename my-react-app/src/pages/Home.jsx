import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <section className="max-w-2xl space-y-5">
      <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Campus Activity & Discovery</p>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Find your place on campus.</h1>
      <p className="text-lg leading-relaxed text-slate-600">
        A single place to discover student events and organizations. The platform foundation is ready for the team to build on.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link to="/events" className="rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800">Explore events</Link>
        <Link to="/organizations" className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 hover:bg-slate-100">View organizations</Link>
      </div>
    </section>
  )
}
