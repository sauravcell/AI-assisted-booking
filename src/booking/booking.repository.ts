import { Pool } from "pg";

import { db } from "../database/database";

import { logger } from "../shared/logger/logger";

import {
  AvailableSlotSummary,
  Booking,
  BookingSummary,
  BookSlotResult,
  CancelBookingResult,
  DoctorAvailabilitySlot,
  DoctorWithAvailability,
} from "./booking.types";

/** Slots per doctor returned by searchDoctorsWithAvailability. */
const MAX_SLOTS_PER_DOCTOR = 5;

/** Look-ahead window when no specific date is requested. */
const DEFAULT_AVAILABILITY_WINDOW_DAYS = 7;

/** Cap on rows returned by findByCustomerId when includeHistory is set. */
const MAX_BOOKING_HISTORY_ROWS = 20;

export class BookingRepository {
  constructor(private readonly pool: Pool = db) {}

  private mapBookingRow(row: any): Booking {
    return {
      id: row.id,
      customerId: row.customer_id,
      doctorId: row.doctor_id,
      availabilityId: row.availability_id,
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapBookingSummaryRow(row: any): BookingSummary {
    return {
      id: row.id,
      status: row.status,
      notes: row.notes,
      doctorName: row.doctor_name,
      specialization: row.specialization,
      availableDate: row.available_date,
      startTime: row.start_time,
      endTime: row.end_time,
    };
  }

  /**
   * Returns a customer's own bookings, joined with doctor and slot
   * details in one round trip. Defaults to upcoming BOOKED
   * appointments only, soonest first; with includeHistory, also
   * returns past/cancelled bookings (capped at
   * MAX_BOOKING_HISTORY_ROWS), most recent first.
   */
  async findByCustomerId(
    customerId: string,
    includeHistory: boolean,
  ): Promise<BookingSummary[]> {
    const statusCondition = includeHistory ? "" : "AND b.status = 'BOOKED'";
    const order = includeHistory ? "DESC" : "ASC";
    const limitClause = includeHistory
      ? `LIMIT ${MAX_BOOKING_HISTORY_ROWS}`
      : "";

    const query = `
      SELECT
        b.id,
        b.status,
        b.notes,
        d.name AS doctor_name,
        d.specialization,
        da.available_date,
        da.start_time,
        da.end_time
      FROM bookings b
      JOIN doctors d ON d.id = b.doctor_id
      JOIN doctor_availability da ON da.id = b.availability_id
      WHERE b.customer_id = $1
        ${statusCondition}
      ORDER BY da.available_date ${order}, da.start_time ${order}
      ${limitClause};
    `;

    const result = await this.pool.query(query, [customerId]);

    logger.debug(
      { customerId, includeHistory, count: result.rows.length },
      "[booking.repository] findByCustomerId",
    );

    return result.rows.map((row) => this.mapBookingSummaryRow(row));
  }

  private mapAvailabilityRow(row: any): DoctorAvailabilitySlot {
    return {
      id: row.id,
      doctorId: row.doctor_id,
      availableDate: row.available_date,
      startTime: row.start_time,
      endTime: row.end_time,
      isAvailable: row.is_available,
    };
  }

  /**
   * Returns open slots for a doctor, optionally filtered to one date.
   *
   * is_available is the single source of truth here — bookSlot()
   * and cancelBooking() below are the only places that ever flip it.
   */
  async findAvailableSlots(
    doctorId: string,
    date?: string,
  ): Promise<DoctorAvailabilitySlot[]> {
    const conditions = ["doctor_id = $1", "is_available = true"];
    const values: unknown[] = [doctorId];

    if (date) {
      values.push(date);
      conditions.push(`available_date = $${values.length}`);
    }

    const query = `
      SELECT *
      FROM doctor_availability
      WHERE ${conditions.join(" AND ")}
      ORDER BY available_date, start_time;
    `;

    const result = await this.pool.query(query, values);

    logger.debug(
      { doctorId, date, count: result.rows.length },
      "[booking.repository] findAvailableSlots",
    );

    return result.rows.map((row) => this.mapAvailabilityRow(row));
  }

  private mapDoctorWithAvailabilityRows(rows: any[]): DoctorWithAvailability[] {
    const doctors: DoctorWithAvailability[] = [];
    const byDoctorId = new Map<string, DoctorWithAvailability>();

    for (const row of rows) {
      let doctor = byDoctorId.get(row.doctor_id);

      if (!doctor) {
        doctor = {
          id: row.doctor_id,
          name: row.name,
          specialization: row.specialization,
          consultationFee:
            row.consultation_fee !== null ? Number(row.consultation_fee) : null,
          experienceYears: row.experience_years,
          bio: row.bio,
          slots: [],
        };

        byDoctorId.set(row.doctor_id, doctor);
        doctors.push(doctor);
      }

      doctor.slots.push(this.mapSlotSummaryRow(row));
    }

    return doctors;
  }

  private mapSlotSummaryRow(row: any): AvailableSlotSummary {
    return {
      id: row.slot_id,
      availableDate: row.available_date,
      startTime: row.start_time,
      endTime: row.end_time,
    };
  }

  /**
   * Searches doctors by name/specialization and returns their open
   * slots in the same round trip — collapses the searchDoctor ->
   * checkAvailability chain into one call for the "who's free"
   * question. A doctor with zero open slots in range is omitted;
   * use searchDoctor instead if availability doesn't matter.
   *
   * Without a date, looks ahead DEFAULT_AVAILABILITY_WINDOW_DAYS and
   * caps each doctor to MAX_SLOTS_PER_DOCTOR slots (via a per-doctor
   * ROW_NUMBER window) so a doctor with a fully open schedule can't
   * blow up the payload back to the LLM.
   */
  async searchDoctorsWithAvailability(input: {
    keyword?: string;
    date?: string;
  }): Promise<DoctorWithAvailability[]> {
    const values: unknown[] = [];

    const dateCondition = input.date
      ? (() => {
          values.push(input.date);
          return `da.available_date = $${values.length}`;
        })()
      : `da.available_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${DEFAULT_AVAILABILITY_WINDOW_DAYS} days'`;

    let keywordCondition = "";

    if (input.keyword) {
      values.push(`%${input.keyword}%`);
      keywordCondition = `AND (d.name ILIKE $${values.length} OR d.specialization ILIKE $${values.length})`;
    }

    const query = `
      WITH ranked_slots AS (
        SELECT
          da.id,
          da.doctor_id,
          da.available_date,
          da.start_time,
          da.end_time,
          ROW_NUMBER() OVER (
            PARTITION BY da.doctor_id
            ORDER BY da.available_date, da.start_time
          ) AS slot_rank
        FROM doctor_availability da
        WHERE da.is_available = true
          AND ${dateCondition}
      )
      SELECT
        d.id AS doctor_id,
        d.name,
        d.specialization,
        d.consultation_fee,
        d.experience_years,
        d.bio,
        rs.id AS slot_id,
        rs.available_date,
        rs.start_time,
        rs.end_time
      FROM doctors d
      JOIN ranked_slots rs ON rs.doctor_id = d.id
      WHERE d.is_active = true
        AND rs.slot_rank <= ${MAX_SLOTS_PER_DOCTOR}
        ${keywordCondition}
      ORDER BY d.name, rs.available_date, rs.start_time;
    `;

    const result = await this.pool.query(query, values);

    logger.debug(
      { keyword: input.keyword, date: input.date, rows: result.rows.length },
      "[booking.repository] searchDoctorsWithAvailability",
    );

    return this.mapDoctorWithAvailabilityRows(result.rows);
  }

  /**
   * Books a slot atomically.
   *
   * Every booking gets its own row, including a rebooking of a
   * previously-cancelled slot — bookings.availability_id only has a
   * uniqueness constraint among ACTIVE (BOOKED) rows (see
   * migrations/0001_bookings_active_slot_unique.sql), so cancelled
   * history is never overwritten.
   *
   * FOR UPDATE locks the availability row for the duration of the
   * transaction, so two simultaneous requests can never both book
   * the same slot.
   */
  async bookSlot(input: {
    customerId: string;
    doctorId: string;
    availabilityId: string;
    notes?: string;
  }): Promise<BookSlotResult> {
    const client = await this.pool.connect();

    logger.debug({ input }, "[booking.repository] bookSlot: starting transaction");

    try {
      await client.query("BEGIN");

      const availabilityResult = await client.query(
        `SELECT * FROM doctor_availability WHERE id = $1 FOR UPDATE;`,
        [input.availabilityId],
      );

      const availability = availabilityResult.rows[0];

      if (!availability) {
        await client.query("ROLLBACK");

        logger.debug(
          { availabilityId: input.availabilityId },
          "[booking.repository] bookSlot: SLOT_NOT_FOUND",
        );

        return {
          success: false,
          reason: "SLOT_NOT_FOUND",
          message: "That availability slot does not exist.",
        };
      }

      if (!availability.is_available) {
        await client.query("ROLLBACK");

        logger.debug(
          { availabilityId: input.availabilityId },
          "[booking.repository] bookSlot: SLOT_UNAVAILABLE",
        );

        return {
          success: false,
          reason: "SLOT_UNAVAILABLE",
          message: "That slot is no longer available.",
        };
      }

      const bookingRow = (
        await client.query(
          `
          INSERT INTO bookings (customer_id, doctor_id, availability_id, notes)
          VALUES ($1, $2, $3, $4)
          RETURNING *;
          `,
          [
            input.customerId,
            input.doctorId,
            input.availabilityId,
            input.notes ?? null,
          ],
        )
      ).rows[0];

      await client.query(
        `UPDATE doctor_availability SET is_available = false, updated_at = NOW() WHERE id = $1;`,
        [input.availabilityId],
      );

      await client.query("COMMIT");

      logger.debug(
        { bookingId: bookingRow.id, availabilityId: input.availabilityId },
        "[booking.repository] bookSlot: committed",
      );

      return { success: true, booking: this.mapBookingRow(bookingRow) };
    } catch (error) {
      await client.query("ROLLBACK");

      logger.error(
        { err: error, input },
        "[booking.repository] bookSlot: transaction failed, rolled back",
      );

      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Cancels a booking atomically and frees up its slot again.
   *
   * FOR UPDATE locks the booking row so a double-cancel request
   * can't race past the ALREADY_CANCELLED check.
   */
  async cancelBooking(input: {
    bookingId: string;
    customerId: string;
  }): Promise<CancelBookingResult> {
    const client = await this.pool.connect();

    logger.debug({ input }, "[booking.repository] cancelBooking: starting transaction");

    try {
      await client.query("BEGIN");

      const bookingResult = await client.query(
        `SELECT * FROM bookings WHERE id = $1 FOR UPDATE;`,
        [input.bookingId],
      );

      const booking = bookingResult.rows[0];

      if (!booking) {
        await client.query("ROLLBACK");

        logger.debug(
          { bookingId: input.bookingId },
          "[booking.repository] cancelBooking: BOOKING_NOT_FOUND",
        );

        return {
          success: false,
          reason: "BOOKING_NOT_FOUND",
          message: "No booking found with that id.",
        };
      }

      if (booking.customer_id !== input.customerId) {
        await client.query("ROLLBACK");

        logger.debug(
          { bookingId: input.bookingId, customerId: input.customerId },
          "[booking.repository] cancelBooking: NOT_OWNER",
        );

        return {
          success: false,
          reason: "NOT_OWNER",
          message: "This booking does not belong to this patient.",
        };
      }

      if (booking.status === "CANCELLED") {
        await client.query("ROLLBACK");

        logger.debug(
          { bookingId: input.bookingId },
          "[booking.repository] cancelBooking: ALREADY_CANCELLED",
        );

        return {
          success: false,
          reason: "ALREADY_CANCELLED",
          message: "This booking is already cancelled.",
        };
      }

      const updateResult = await client.query(
        `
        UPDATE bookings
        SET status = 'CANCELLED', updated_at = NOW()
        WHERE id = $1
        RETURNING *;
        `,
        [input.bookingId],
      );

      await client.query(
        `UPDATE doctor_availability SET is_available = true, updated_at = NOW() WHERE id = $1;`,
        [booking.availability_id],
      );

      await client.query("COMMIT");

      logger.debug(
        { bookingId: input.bookingId },
        "[booking.repository] cancelBooking: committed",
      );

      return {
        success: true,
        booking: this.mapBookingRow(updateResult.rows[0]),
      };
    } catch (error) {
      await client.query("ROLLBACK");

      logger.error(
        { err: error, input },
        "[booking.repository] cancelBooking: transaction failed, rolled back",
      );

      throw error;
    } finally {
      client.release();
    }
  }
}
