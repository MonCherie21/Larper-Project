import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAdminRole } from '../services/admin'
import StatusPanel from './StatusPanel'

export default function AdminGate({ children }) {
  const [retry, setRetry] = useState(0)
  const [state, setState] = useState({ status: 'loading', retry: 0 })

  useEffect(() => {
    let live = true
    fetchAdminRole().then((result) => {
      if (live) setState({ status: result.authorized ? 'ready' : result.user ? 'forbidden' : 'signed-out', retry, user: result.user })
    }).catch(() => { if (live) setState({ status: 'error', retry }) })
    return () => { live = false }
  }, [retry])

  if (state.retry !== retry || state.status === 'loading') return <StatusPanel status="loading" />
  if (state.status === 'signed-out') return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <h1 className="text-2xl font-bold">Administrator sign-in required</h1>
      <Link className="mt-4 inline-block rounded-xl bg-indigo-700 px-5 py-3 font-semibold text-white" to="/sign-in?next=%2Fadmin">Sign in</Link>
    </div>
  )
  if (state.status === 'forbidden') return <StatusPanel status="empty" title="Administrator access only" description="Your account does not have administrator permissions." />
  if (state.status === 'error') return <StatusPanel status="error" title="Could not verify administrator account" description="Check the Supabase connection and permissions." onRetry={() => setRetry(n => n + 1)} />
  return typeof children === 'function' ? children(state.user) : children
}
