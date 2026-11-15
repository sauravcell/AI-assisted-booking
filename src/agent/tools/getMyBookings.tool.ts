import { z } from "zod";

import { AgentTool, ToolContext } from "./agent-tools";
import { BookingService } from "../../booking/booking.service";

export interface GetMyBookingsToolInput {
  includeHistory?: boolean;
}

export class GetMyBookingsTool implements AgentTool<GetMyBookingsToolInput> {
  readonly name = "getMyBookings";

  readonly description =
    "Get the current patient's own appointments, with doctor and slot details included. " +
    "By default returns only upcoming booked appointments. Set includeHistory to true to " +
    "also include past and cancelled appointments (most recent 20).";

  readonly schema = z.object({
    includeHistory: z
      .boolean()
      .optional()
      .describe(
        "Include past and cancelled appointments in addition to upcoming ones.",
      ),
  });

  constructor(private readonly bookingService: BookingService) {}

  execute(input: GetMyBookingsToolInput, context: ToolContext) {
    return this.bookingService.getMyBookings(context.customerId, input);
  }
}
