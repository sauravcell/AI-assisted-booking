import { BookingRepository } from "./booking.repository";

import {
  CancelBookingInput,
  CheckAvailabilityInput,
  CreateBookingInput,
  GetMyBookingsInput,
  SearchDoctorsWithAvailabilityInput,
} from "./booking.types";

import { normalizeSpecializationKeyword } from "../doctor/doctor.service";

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
   * Searches doctors by name/specialization and returns their open
   * slots in one call, instead of chaining checkAvailability per
   * doctor after a search.
   */
  async searchDoctorsWithAvailability(
    input: SearchDoctorsWithAvailabilityInput,
  ) {
    return this.bookingRepository.searchDoctorsWithAvailability({
      keyword: normalizeSpecializationKeyword(input.keyword),
      date: input.date,
    });
  }

  /**
   * Gets a customer's own bookings — upcoming by default, or full
   * history (past + cancelled) when requested.
   */
  async getMyBookings(customerId: string, input: GetMyBookingsInput) {
    return this.bookingRepository.findByCustomerId(
      customerId,
      Boolean(input.includeHistory),
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
