import { BookingRepository } from "./booking.repository";

import {
  CancelBookingInput,
  CheckAvailabilityInput,
  CreateBookingInput,
} from "./booking.types";

/**
 * --------------------------------------------------------
 * Booking Service
 * --------------------------------------------------------
 *
 * Business layer.
 *
 * No SQL.
 *
 * Delegates persistence — including the booking/cancellation
 * transactions — to the repository.
 */
export class BookingService {
  constructor(private readonly bookingRepository: BookingRepository) {}

  /**
   * Lists open slots for a doctor, optionally for one date.
   */
  async checkAvailability(input: CheckAvailabilityInput) {
    return this.bookingRepository.findAvailableSlots(
      input.doctorId,
      input.date,
    );
  }

  /**
   * Books an availability slot for a customer.
   */
  async createBooking(input: CreateBookingInput) {
    return this.bookingRepository.bookSlot(input);
  }

  /**
   * Cancels a booking on behalf of the customer that owns it.
   */
  async cancelBooking(input: CancelBookingInput) {
    return this.bookingRepository.cancelBooking(input);
  }
}
