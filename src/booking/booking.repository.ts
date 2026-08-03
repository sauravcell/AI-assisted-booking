import { Pool } from "pg";

import { db } from "../database/database";

import { logger } from "../shared/logger/logger";

import {
  Booking,
  BookSlotResult,
  CancelBookingResult,
  DoctorAvailabilitySlot,
} from "./booking.types";

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

  /**
   * Books a slot atomically.
   *
   * bookings.availability_id is UNIQUE, so a cancelled booking's row
   * still occupies that slot forever. To make a cancelled slot
   * bookable again, we UPDATE that existing row back to BOOKED
   * instead of inserting a new one.
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

      const existingBookingResult = await client.query(
        `SELECT * FROM bookings WHERE availability_id = $1 FOR UPDATE;`,
        [input.availabilityId],
      );

      const existingBooking = existingBookingResult.rows[0];

      const bookingRow = existingBooking
        ? (
            await client.query(
              `
              UPDATE bookings
              SET customer_id = $1,
                  doctor_id = $2,
                  status = 'BOOKED',
                  notes = $3,
                  updated_at = NOW()
              WHERE id = $4
              RETURNING *;
              `,
              [
                input.customerId,
                input.doctorId,
                input.notes ?? null,
                existingBooking.id,
              ],
            )
          ).rows[0]
        : (
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
