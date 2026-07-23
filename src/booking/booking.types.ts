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
