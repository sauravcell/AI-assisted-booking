import { Doctor } from "../doctor/doctor.types";

/**
 * Booking entity.
 *
 * Mirrors the bookings table.
 */
export type BookingStatus = "BOOKED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";

export interface Booking {
  id: string;

  customerId: string;

  doctorId: string;

  availabilityId: string;

  status: BookingStatus;

  notes: string | null;

  createdAt: Date;

  updatedAt: Date;
}

/**
 * Availability slot.
 *
 * Mirrors the doctor_availability table.
 */
export interface DoctorAvailabilitySlot {
  id: string;

  doctorId: string;

  availableDate: string;

  startTime: string;

  endTime: string;

  isAvailable: boolean;
}

export interface CheckAvailabilityInput {
  doctorId: string;

  date?: string;
}

export interface CreateBookingInput {
  customerId: string;

  doctorId: string;

  availabilityId: string;

  notes?: string;
}

export interface CancelBookingInput {
  bookingId: string;

  customerId: string;
}

/**
 * Result types below are returned by the repository/service for
 * expected business outcomes (slot taken, booking not found, etc).
 *
 * These are normal return values, not thrown errors — the tool
 * layer forwards them to the LLM so it can explain the outcome to
 * the patient instead of the whole turn failing.
 */
export type BookSlotResult =
  | { success: true; booking: Booking }
  | {
      success: false;
      reason: "SLOT_NOT_FOUND" | "SLOT_UNAVAILABLE";
      message: string;
    };

export type CancelBookingResult =
  | { success: true; booking: Booking }
  | {
      success: false;
      reason: "BOOKING_NOT_FOUND" | "NOT_OWNER" | "ALREADY_CANCELLED";
      message: string;
    };

export interface SearchDoctorsWithAvailabilityInput {
  keyword?: string;

  date?: string;
}

/**
 * A single open slot, as surfaced inside DoctorWithAvailability.
 *
 * doctorId/isAvailable are dropped versus DoctorAvailabilitySlot —
 * both are implied by nesting under one already-matched doctor.
 */
export interface AvailableSlotSummary {
  id: string;

  availableDate: string;

  startTime: string;

  endTime: string;
}

/**
 * Result of searchDoctorsWithAvailability: a doctor plus their open
 * slots, so the agent gets both in one tool call instead of chaining
 * searchDoctor -> checkAvailability. Only doctors with at least one
 * open slot in range are included.
 */
export interface DoctorWithAvailability extends Doctor {
  slots: AvailableSlotSummary[];
}

export interface GetMyBookingsInput {
  includeHistory?: boolean;
}

/**
 * One of the patient's own bookings, denormalized with the doctor
 * and slot details needed to display it — avoids the LLM needing a
 * separate lookup per booking to say who/when.
 */
export interface BookingSummary {
  id: string;

  status: BookingStatus;

  notes: string | null;

  doctorName: string;

  specialization: string;

  availableDate: string;

  startTime: string;

  endTime: string;
}
