// Original illustrative emblems for the seeded demonstration organizations.
// Database logo_url takes precedence when a real group supplies an authorized logo.
// These are NOT official university or student-organization seals.
const DEMO_LOGOS = {
  'ccs': '/org-logos/ccs.svg',
  'ccs student council': '/org-logos/ccs.svg',
  'chess and board games club': '/org-logos/chess-board-games.svg',
  'cte test organization': '/org-logos/cte-test-organization.svg',
  'cultural heritage society': '/org-logos/cultural-heritage-society.svg',
  'dance troupe': '/org-logos/dance-troupe.svg',
  'robotics club': '/org-logos/robotics-club.svg',
  'varsity basketball': '/org-logos/varsity-basketball.svg',
}

export function demoOrganizationLogo(name) {
  return DEMO_LOGOS[String(name || '').trim().toLowerCase()] || null
}
