import { Pool } from "pg";
import { db } from "../database/database";

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
    console.log("DB CALL => Final all doctor: ", result.rows ?? "none");
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
    console.log("DB CALL => Final doctor by id: ", result.rows[0] ?? "none");

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
    console.log(
      "DB CALL => Final doctor by specialization: ",
      result.rows ?? "none",
    );

    return result.rows;
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
    console.log("DB CALL => search hDoctors: ", result.rows ?? "none");

    return result.rows;
  }
}
