import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StatusPanel from '../components/StatusPanel'
import { useAuth } from '../hooks/useAuth'
import { EVENT_CATEGORIES } from '../lib/eventFormat'
import { fetchStudentProfile } from '../services/student'
import { savePreferences } from '../services/preferences'

const PROGRAMS = ['BS Computer Science', 'BS Information Technology', 'BS Education', 'BS Elementary Education', 'Other']
function toForm(profile) {
  return {
    academic_program: profile?.academic_program || '',
    interests: profile?.interests || '',
    preferred_categories: profile?.preferred_categories || [],
    extracurricular_interests: (profile?.extracurricular_interests || []).join(', '),
  }
}

export default function Preferences() {
  const { user, loading } = useAuth()
  const [state, setState] = useState({ status: 'loading', userId: null })
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user?.id) return undefined
    let live = true
    fetchStudentProfile(user.id)
      .then(profile => {
        if (live) setState({ status: 'ready', userId: user.id, initial: toForm(profile) })
      })
      .catch(() => { if (live) setState({ status: 'error', userId: user.id }) })
    return () => { live = false }
  }, [user?.id])

  const viewStatus = state.userId === user?.id ? state.status : 'loading'


  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-700">Personalized campus discovery</p>
        <h1 className="mt-1 text-3xl font-extrabold text-slate-900">Your interests</h1>
        <p className="mt-2 text-sm text-slate-600">Share only what helps you discover events. Preferences do not limit which organizations or events you can browse.</p>
      </header>
      {loading && <StatusPanel status="loading" />}
      {!loading && !user && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-600">Sign in to save interests.</p>
          <Link to="/sign-in?next=%2Fpreferences" className="mt-3 inline-block text-sm font-bold text-indigo-700">Sign in →</Link>
        </div>
      )}
      {user && viewStatus === 'loading' && <StatusPanel status="loading" />}
      {user && viewStatus === 'error' && <StatusPanel status="error" title="Couldn't load preferences" description="Check database permissions and the Features 06–08 migration." />}
      {user && viewStatus === 'ready' && (
        <PreferenceForm key={user.id} initial={state.initial} onSave={async (event, form) => {
          event.preventDefault()
          setSaving(true); setError(''); setNotice('')
          try { await savePreferences(user.id, form); setNotice('Preferences saved. Open the dashboard to view your recommendations.') }
          catch (err) { setError(err.message || 'Could not save preferences.') }
          finally { setSaving(false) }
        }} saving={saving} error={error} notice={notice} />
      )}
    </div>
  )
}

function PreferenceForm({ initial, onSave, saving, error, notice }) {
  const [form, setForm] = useState(initial)
  const programOptions = PROGRAMS.includes(form.academic_program) || !form.academic_program
    ? PROGRAMS : [form.academic_program, ...PROGRAMS]
  return (
    <form onSubmit={event => onSave(event, form)} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div>
        <label htmlFor="pref-program" className="block text-sm font-semibold text-slate-800">Academic program</label>
        <select id="pref-program" value={form.academic_program} onChange={e => setForm(p => ({ ...p, academic_program: e.target.value }))} className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm">
          <option value="">Prefer not to say</option>
          {programOptions.map(name => <option key={name}>{name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="pref-interests" className="block text-sm font-semibold text-slate-800">Personal interests</label>
        <input id="pref-interests" value={form.interests} maxLength={300} onChange={e => setForm(p => ({ ...p, interests: e.target.value }))}
          placeholder="e.g. robotics, programming, chess" className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm" />
        <p className="mt-1 text-xs text-slate-500">Separate interests with commas.</p>
      </div>
      <fieldset>
        <legend className="text-sm font-semibold text-slate-800">Preferred activity categories</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {EVENT_CATEGORIES.map(cat => (
            <label key={cat} className={'cursor-pointer rounded-full border px-4 py-2 text-sm ' + (form.preferred_categories.includes(cat) ? 'border-indigo-700 bg-indigo-50 font-bold text-indigo-800' : 'border-slate-300 text-slate-700')}>
              <input className="sr-only" type="checkbox" checked={form.preferred_categories.includes(cat)} onChange={() => setForm(p => ({
                ...p, preferred_categories: p.preferred_categories.includes(cat) ? p.preferred_categories.filter(x => x !== cat) : [...p.preferred_categories, cat],
              }))} />
              {cat}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="pref-extra" className="block text-sm font-semibold text-slate-800">Optional extracurricular interests</label>
        <input id="pref-extra" maxLength={300} value={form.extracurricular_interests}
          onChange={e => setForm(p => ({ ...p, extracurricular_interests: e.target.value }))}
          placeholder="e.g. volunteering, performing arts" className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm" />
      </div>
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={saving} className="rounded-xl bg-indigo-700 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-800 disabled:opacity-50">{saving ? 'Saving...' : 'Save my interests'}</button>
        <Link to="/" className="text-sm font-semibold text-indigo-700 hover:underline">Back to dashboard</Link>
      </div>
    </form>
  )
}
