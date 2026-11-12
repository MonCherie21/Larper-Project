// Campus Connect student self-registration format.
// This validates format only; Supabase email confirmation verifies ownership.
export const LSPU_EMAIL_EXAMPLE = '0312-3456@lspu.edu.ph'
const LSPU_STUDENT_EMAIL = /^03[0-9]{2}-[0-9]{4}@lspu\.edu\.ph$/i

export function isLspuStudentEmail(value) {
  return LSPU_STUDENT_EMAIL.test(String(value || '').trim())
}
