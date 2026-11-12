-- ============================================================================
-- Sample test records — Campus Activity & Discovery Platform
--
-- profiles.id is a foreign key to auth.users.id, so you can't just invent
-- UUIDs here. Before running this:
--   1. Create 3 test users (Supabase Studio → Authentication → Add user, or
--      supabase.auth.admin.createUser in a server-side script):
--        - alice@example.edu   (will become an organizer)
--        - bob@example.edu     (will become a student)
--        - admin@example.edu   (will become an admin)
--   2. Copy their real auth.users UUIDs and replace the three placeholders
--      below (ALICE_ID, BOB_ID, ADMIN_ID) everywhere they appear.
--   3. If you kept the on_auth_user_created trigger from schema.sql, each
--      signup already created a bare profiles row — the UPDATE statements
--      below just fill in role/program/interests. If you removed that
--      trigger, uncomment the INSERT block instead.
-- ============================================================================

update public.profiles set role = 'organizer', academic_program = 'BS Computer Science', interests = 'robotics, hackathons' where id = 'ALICE_ID';
update public.profiles set role = 'student', academic_program = 'BS Information Technology', interests = 'esports, design' where id = 'BOB_ID';
update public.profiles set role = 'admin' where id = 'ADMIN_ID';

-- Uncomment if you did NOT keep the on_auth_user_created trigger:
-- insert into public.profiles (id, full_name, email, role, academic_program, interests) values
--   ('ALICE_ID', 'Alice Santos', 'alice@example.edu', 'organizer', 'BS Computer Science', 'robotics, hackathons'),
--   ('BOB_ID', 'Bob Cruz', 'bob@example.edu', 'student', 'BS Information Technology', 'esports, design'),
--   ('ADMIN_ID', 'Admin User', 'admin@example.edu', 'admin', null, null);

-- Organization owned by Alice
insert into public.organizations (id, name, description, category, owner_id) values
  ('a1111111-1111-1111-1111-111111111111', 'CCS', 'College of Computer Science.', 'Academic', 'ALICE_ID');

-- Events under that organization — one approved, one still pending
insert into public.events (id, title, description, category, location, start_time, end_time, organization_id, approval_status) values
  ('e1111111-1111-1111-1111-111111111111', 'Freshman Hackathon 2026', '24-hour build sprint for first-year students.', 'Competition', 'CCS Building, Room 301', '2026-12-01 09:00+08', '2026-12-02 09:00+08', 'a1111111-1111-1111-1111-111111111111', 'approved'),
  ('e2222222-2222-2222-2222-222222222222', 'General Assembly', 'Semestral council meeting, open to all CCS students.', 'Meeting', 'Main Auditorium', '2026-11-20 14:00+08', '2026-11-20 16:00+08', 'a1111111-1111-1111-1111-111111111111', 'pending');

-- Bob RSVPs to the approved event
insert into public.rsvps (user_id, event_id) values
  ('BOB_ID', 'e1111111-1111-1111-1111-111111111111');

-- Bob bookmarks it too
insert into public.bookmarks (user_id, event_id) values
  ('BOB_ID', 'e1111111-1111-1111-1111-111111111111');