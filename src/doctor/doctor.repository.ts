import { Pool } from "pg";
import { db } from "../database/database";

import { logger } from "../shared/logger/logger";
import { Doctor } from "./doctor.types";

const DOCTOR_COLUMNS = `
  id,
  name,
  specialization,
  consultation_fee,
  experience_years,
  bio
`;

export class DoctorRepository {
  constructor(private readonly pool: Pool = db) {}

  private mapRow(row: any): Doctor {
    return {
      id: row.id,
      name: row.name,
      specialization: row.specialization,
      consultationFee:
        row.consultation_fee !== null ? Number(row.consultation_fee) : null,
      experienceYears: row.experience_years,
      bio: row.bio,
    };
  }

  async findAll(): Promise<Doctor[]> {
    const query = `
        SELECT ${DOCTOR_COLUMNS}
        FROM doctors
        WHERE is_active = true
        ORDER BY name;
    `;

    const result = await this.pool.query(query);
    logger.debug({ count: result.rows.length }, "[doctor.repository] findAll");
    return result.rows.map((row) => this.mapRow(row));
  }

  async findById(id: string): Promise<Doctor | null> {
    const query = `
        SELECT ${DOCTOR_COLUMNS}
        FROM doctors
        WHERE id = $1
        LIMIT 1;
    `;

    const result = await this.pool.query(query, [id]);
    logger.debug(
      { id, found: Boolean(result.rows[0]) },
      "[doctor.repository] findById",
    );

    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async findBySpecialization(specialization: string): Promise<Doctor[]> {
    const query = `
        SELECT ${DOCTOR_COLUMNS}
        FROM doctors
        WHERE specialization ILIKE $1
          AND is_active = true
        ORDER BY name;
    `;

    const result = await this.pool.query(query, [`%${specialization}%`]);
    logger.debug(
      { specialization, count: result.rows.length },
      "[doctor.repository] findBySpecialization",
    );

    return result.rows.map((row) => this.mapRow(row));
  }

  /**
   * Distinct specialties actually available at this hospital right
   * now. Used to ground the agent in real values instead of it
   * guessing a specialty name from the patient's wording.
   */
  async findDistinctSpecializations(): Promise<string[]> {
    const query = `
        SELECT DISTINCT specialization
        FROM doctors
        WHERE is_active = true
        ORDER BY specialization;
    `;

    const result = await this.pool.query(query);

    logger.debug(
      { count: result.rows.length },
      "[doctor.repository] findDistinctSpecializations",
    );

    return result.rows.map((row) => row.specialization);
  }

  async searchDoctors(keyword: string): Promise<Doctor[]> {
    const query = `
        SELECT ${DOCTOR_COLUMNS}
        FROM doctors
        WHERE
            is_active = true
            AND
            (
                name ILIKE $1
                OR specialization ILIKE $1
            )
        ORDER BY name;
    `;

    const result = await this.pool.query(query, [`%${keyword}%`]);
    logger.debug(
      { keyword, count: result.rows.length },
      "[doctor.repository] searchDoctors",
    );

    return result.rows.map((row) => this.mapRow(row));
  }
}
