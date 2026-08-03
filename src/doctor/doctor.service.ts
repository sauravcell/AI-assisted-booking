import { DoctorRepository } from "../doctor/doctor.repository";

import { SearchDoctorInput } from "./doctor.types";

/**
 * --------------------------------------------------------
 * Doctor Service
 * --------------------------------------------------------
 *
 * Business layer.
 *
 * No SQL.
 *
 * Delegates persistence to the repository.
 */

const SPECIALIZATION_ALIASES: Record<string, string> = {
  cardiologist: "Cardiology",
  neurologist: "Neurology",
  dermatologist: "Dermatology",
};

export interface SearchDoctorsInput {
  keyword?: string;
}

export class DoctorService {
  constructor(private readonly doctorRepository: DoctorRepository) {}

  /**
   * Returns every active doctor.
   */
  async getAllDoctors() {
    return this.doctorRepository.findAll();
  }

  /**
   * Search doctors.
   *
   * If no keyword supplied,
   * returns all doctors.
   */
  async searchDoctors(input: SearchDoctorsInput) {
    const keyword = input.keyword?.trim();

    if (!keyword) {
      return this.doctorRepository.findAll();
    }

    const normalizedKeyword =
      SPECIALIZATION_ALIASES[keyword.toLowerCase()] ?? keyword;

    return this.doctorRepository.searchDoctors(normalizedKeyword);
  }

  /**
   * Fetch one doctor.
   */
  async getDoctorById(id: string) {
    return this.doctorRepository.findById(id);
  }

  /**
   * Lists every specialty actually available right now, so the
   * agent can ground a specialty-based search in a real value
   * instead of guessing one from the patient's wording.
   */
  async listSpecialties(): Promise<string[]> {
    return this.doctorRepository.findDistinctSpecializations();
  }
}
