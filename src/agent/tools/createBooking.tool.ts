import { z } from "zod";

import { AgentTool, ToolContext } from "./agent-tools";
import { BookingService } from "../../booking/booking.service";

export interface CreateBookingToolInput {
  doctorId: string;
  availabilityId: string;
  notes?: string;
}

export class CreateBookingTool implements AgentTool<CreateBookingToolInput> {
  readonly name = "createBooking";

  readonly description =
    "Book an appointment for the current patient. Requires the doctor's id and the availability slot id chosen from a previous checkAvailability result. Only call this after the patient has confirmed the doctor, date, and time.";

  readonly schema = z.object({
    doctorId: z
      .uuid()
      .describe("The doctor's id, from a previous searchDoctor result."),
    availabilityId: z
      .uuid()
      .describe(
        "The id of the specific slot to book, from a previous checkAvailability result.",
      ),
    notes: z.string().optional().describe("Optional notes for the appointment."),
  });

  constructor(private readonly bookingService: BookingService) {}

  execute(input: CreateBookingToolInput, context: ToolContext) {
    return this.bookingService.createBooking({
      customerId: context.customerId,
      doctorId: input.doctorId,
      availabilityId: input.availabilityId,
      notes: input.notes,
    });
  }
}
