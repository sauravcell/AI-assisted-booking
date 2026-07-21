/**
 * Doctor entity.
 *
 * Mirrors the doctors table.
 */
export interface Doctor {
  id: string;

  name: string;

  specialization: string;

  consultationFee: number;

  isActive: boolean;

  createdAt: Date;
}

/**
 * Input used when searching doctors.
 */
export interface SearchDoctorInput {
  keyword?: string;
}
