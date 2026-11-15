/**
 * Doctor entity, as surfaced to the LLM tools.
 *
 * Deliberately excludes columns the agent doesn't need to
 * decide/present a doctor (is_active, created_at, updated_at,
 * email) to keep tool-result payloads small.
 */
export interface Doctor {
  id: string;

  name: string;

  specialization: string;

  consultationFee: number | null;

  experienceYears: number | null;

  bio: string | null;
}

/**
 * Input used when searching doctors.
 */
export interface SearchDoctorInput {
  keyword?: string;
}
