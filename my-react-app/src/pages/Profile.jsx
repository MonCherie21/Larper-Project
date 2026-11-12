import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import StatusPanel from '../components/StatusPanel'
import { useAuth } from '../hooks/useAuth'
import { fetchStudentProfile, signOut } from '../services/student'

export default function Profile() {
  const navigate = useNavigate()
  const { user, loading, configured } = useAuth()
  const [state, setState] = useState({ status: 'loading', userId: null })
  const [signingOut, setSigningOut] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!user?.id) return undefined
    let active = true
    fetchStudentProfile(user.id)
      .then((profile) => {
        if (active) setState({ status: 'ready', userId: user.id, profile })
      })
      .catch(() => {
        if (active) setState({ status: 'error', userId: user.id })
      })
    return () => { active = false }
  }, [user?.id])

  const logout = async () => {
    setSigningOut(true)
    setMessage('')
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      setMessage(error.message || 'Sign out failed.')
    } finally {
      setSigningOut(false)
    }
  }

  if (!configured) return <StatusPanel status="error" title="Supabase isn't configured" description="Add your project's publishable key and URL to .env." />
  if (loading) return <StatusPanel status="loading" />
  if (!user) return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-2xl font-extrabold text-slate-900">Your student profile</h1>
      <p className="mt-2 text-slate-600">Sign in to see your account information and manage saved events.</p>
      <Link to={'/sign-in?next=' + encodeURIComponent('/profile')} className="mt-6 inline-block rounded-xl bg-indigo-700 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-800">Sign in</Link>
    </div>
  )

  const viewStatus = state.userId === user.id ? state.status : 'loading'
  if (viewStatus === 'loading') return <StatusPanel status="loading" />
  if (viewStatus === 'error') return <StatusPanel status="error" title="Profile not available" description="Could not fetch your profile. Check that the Feature 03 read permissions are applied." />

  const profile = state.profile
  const fullName = profile?.full_name || user.user_metadata?.full_name || 'Campus Connect student'

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-2 sm:py-4">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-700">Your Campus Connect account</p>
        <h1 className="mt-1 text-3xl font-extrabold text-slate-900">{profile?.role === 'admin' ? 'Admin' : profile?.role === 'organizer' ? 'Organizer profile' : 'Student profile'}</h1>
      </header>
      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-indigo-100 text-2xl font-bold text-indigo-800" aria-hidden="true">
            {fullName.trim().charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-extrabold text-slate-900">{fullName}</h2>
            <p className="truncate text-sm text-slate-500">{user.email}</p>
          </div>
        </div>
        <dl className="grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Account type</dt>
            <dd className="mt-1 capitalize text-sm font-semibold text-slate-900">{profile?.role || 'Student'}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Academic program</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">{profile?.academic_program || 'Not provided'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Interests</dt>
            <dd className="mt-1 text-sm text-slate-700">{profile?.interests || 'Not provided'}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
          <Link to="/bookmarks" className="rounded-xl bg-indigo-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-800">My bookmarks</Link>
          <Link to="/preferences" className="rounded-xl border border-indigo-300 px-5 py-2.5 text-sm font-bold text-indigo-700 hover:bg-indigo-50">My interests</Link>
          <button type="button" disabled={signingOut} onClick={logout} className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {signingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
        {message && <p role="alert" className="text-sm text-rose-700">{message}</p>}
      </section>
    </div>
  )
}
