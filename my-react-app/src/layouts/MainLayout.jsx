import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white px-4 py-5 text-center text-sm text-slate-500">
        Campus Connect · Student Around Services
      </footer>
    </div>
  )
}
