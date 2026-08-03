import { Pool } from "pg";
import { db } from "../database/database";

import { logger } from "../shared/logger/logger";

export class DoctorRepository {
  constructor(private readonly pool: Pool = db) {}

  async findAll() {
    const query = `
        SELECT *
        FROM doctors
        WHERE is_active = true
        ORDER BY name;
    `;

    const result = await this.pool.query(query);
    logger.debug({ count: result.rows.length }, "[doctor.repository] findAll");
    return result.rows;
  }

  async findById(id: string) {
    const query = `
        SELECT *
        FROM doctors
        WHERE id = $1
        LIMIT 1;
    `;

    const result = await this.pool.query(query, [id]);
    logger.debug(
      { id, found: Boolean(result.rows[0]) },
      "[doctor.repository] findById",
    );

    return result.rows[0] ?? null;
  }

  async findBySpecialization(specialization: string) {
    const query = `
        SELECT *
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

    return result.rows;
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

  async searchDoctors(keyword: string) {
    const query = `
        SELECT *
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

    return result.rows;
  }
}
