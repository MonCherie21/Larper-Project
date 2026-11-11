import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { signIn, signUp } from '../services/student'

export default function SignIn() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const requested = params.get('next')
  const next = requested?.startsWith('/') && !requested.startsWith('//') ? requested : '/profile'
  const { user, loading, configured } = useAuth()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      if (mode === 'signup') {
        const result = await signUp(name, email.trim(), password)
        if (result.session) navigate(next, { replace: true })
        else setNotice('Account created. Check your inbox for a confirmation email if your Supabase project requires it, then sign in.')
      } else {
        await signIn(email.trim(), password)
        navigate(next, { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Could not sign in. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md py-4 sm:py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
        <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">Campus Connect account</span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">{mode === 'login' ? 'Welcome back' : 'Join Campus Connect'}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">Explore events without signing in. An account is only needed for RSVPs, bookmarks, and your private profile.</p>

        {!configured ? (
          <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">Supabase is not configured in .env.</p>
        ) : loading ? (
          <p className="mt-6 text-sm text-slate-500">Checking your session...</p>
        ) : user ? (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-slate-700">You are signed in as <strong>{user.email}</strong>.</p>
            <Link to={next} className="inline-block rounded-xl bg-indigo-700 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-800">Continue →</Link>
          </div>
        ) : (
          <>
            <form onSubmit={submit} className="mt-7 space-y-4">
              {mode === 'signup' && (
                <div>
                  <label htmlFor="signup-name" className="mb-1.5 block text-sm font-semibold text-slate-700">Name</label>
                  <input id="signup-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" maxLength={80}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100" />
                </div>
              )}
              <div>
                <label htmlFor="account-email" className="mb-1.5 block text-sm font-semibold text-slate-700">Email address</label>
                <input id="account-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="student@example.edu"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100" />
              </div>
              <div>
                <label htmlFor="account-password" className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
                <input id="account-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100" />
              </div>
              {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
              {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
              <button type="submit" disabled={busy} className="w-full rounded-xl bg-indigo-700 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-800 disabled:opacity-50">
                {busy ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>
            <button
              type="button"
              onClick={() => { setMode((value) => value === 'login' ? 'signup' : 'login'); setError(''); setNotice('') }}
              className="mt-5 w-full text-center text-sm font-semibold text-indigo-700 hover:underline"
            >
              {mode === 'login' ? 'New here? Create an account' : 'Already registered? Sign in'}
            </button>
          </>
        )}
      </div>
      <p className="mt-5 text-center text-xs leading-relaxed text-slate-500">
        Campus Connect is a discovery platform; official event eligibility is determined by each organizer.
      </p>
    </div>
  )
}
