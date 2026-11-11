-- ============================================================================
-- Extra sample data for Feature 04 (organization directory).
-- Run AFTER seed.sql. Replace ALICE_ID with the same real UUID you used there.
-- Safe to re-run (on conflict do nothing). Adds rows only; nothing is changed.
-- ============================================================================

insert into public.organizations (id, name, description, category, owner_id) values
  ('a2222222-2222-2222-2222-222222222222', 'Robotics Club', 'Build, program, and compete with robots. No experience needed, we start from the basics.', 'Technology', 'ALICE_ID'),
  ('a3333333-3333-3333-3333-333333333333', 'Varsity Basketball', 'The university basketball team. Open tryouts every semester.', 'Sports', 'ALICE_ID'),
  ('a4444444-4444-4444-4444-444444444444', 'Dance Troupe', 'Contemporary and street dance performances at campus events.', 'Arts', 'ALICE_ID'),
  ('a5555555-5555-5555-5555-555555555555', 'Cultural Heritage Society', 'Celebrating regional languages, food, and traditions through campus festivals.', 'Cultural', 'ALICE_ID'),
  ('a6666666-6666-6666-6666-666666666666', 'Chess and Board Games Club', 'Weekly casual games and an annual inter-college chess tournament.', 'Special Interest', 'ALICE_ID')
on conflict (id) do nothing;

-- Events: upcoming, past (shows under "Recent activities"), and one pending
-- event that must NOT appear on any public organization profile.
insert into public.events (id, title, description, category, location, start_time, end_time, organization_id, approval_status) values
  ('e3333333-3333-3333-3333-333333333333', 'Robotics Demo Day', 'Live demos of this semester''s robots.', 'Technology', 'CCS Building, Lab 2', '2026-11-28 13:00+08', '2026-11-28 17:00+08', 'a2222222-2222-2222-2222-222222222222', 'approved'),
  ('e4444444-4444-4444-4444-444444444444', 'Arduino Basics Workshop', 'Hands-on intro to microcontrollers.', 'Technology', 'CCS Building, Room 204', '2026-10-08 14:00+08', '2026-10-08 17:00+08', 'a2222222-2222-2222-2222-222222222222', 'approved'),
  ('e5555555-5555-5555-5555-555555555555', 'Basketball Tryouts', 'Bring your own shoes and water.', 'Sports', 'University Gym', '2026-11-16 16:00+08', '2026-11-16 19:00+08', 'a3333333-3333-3333-3333-333333333333', 'approved'),
  ('e6666666-6666-6666-6666-666666666666', 'Dance Showcase Auditions', 'Audition slots for the December showcase.', 'Arts & Culture', 'Student Center', '2026-12-05 15:00+08', '2026-12-05 18:00+08', 'a4444444-4444-4444-4444-444444444444', 'pending')
on conflict (id) do nothing;