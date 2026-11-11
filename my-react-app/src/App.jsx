import { BrowserRouter, Route, Routes } from 'react-router-dom'
import MainLayout from './layouts/MainLayout.jsx'
import Home from './pages/Home.jsx'
import Events from './pages/Events.jsx'
import EventDetails from './pages/EventDetails.jsx'
import Organizations from './pages/Organizations.jsx'
import OrganizationProfile from './pages/OrganizationProfile.jsx'
import Bookmarks from './pages/Bookmarks.jsx'
import Profile from './pages/Profile.jsx'
import SignIn from './pages/SignIn.jsx'
import OrganizerDashboard from './pages/OrganizerDashboard.jsx'
import OrganizerEventForm from './pages/OrganizerEventForm.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import Preferences from './pages/Preferences.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="events" element={<Events />} />
          <Route path="events/:id" element={<EventDetails />} />
          <Route path="organizations" element={<Organizations />} />
          <Route path="organizations/:id" element={<OrganizationProfile />} />
          <Route path="bookmarks" element={<Bookmarks />} />
          <Route path="profile" element={<Profile />} />
          <Route path="sign-in" element={<SignIn />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="preferences" element={<Preferences />} />
          <Route path="organizer" element={<OrganizerDashboard />} />
          <Route path="organizer/events/new" element={<OrganizerEventForm />} />
          <Route path="organizer/events/:id/edit" element={<OrganizerEventForm />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
