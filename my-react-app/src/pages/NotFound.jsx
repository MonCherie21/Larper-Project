import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="space-y-4 text-center">
      <h1 className="text-4xl font-bold">404 — Page not found</h1>
      <p className="text-slate-600">This page doesn't exist.</p>
      <Link to="/" className="inline-block rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800">Back to home</Link>
    </section>
  )
}
