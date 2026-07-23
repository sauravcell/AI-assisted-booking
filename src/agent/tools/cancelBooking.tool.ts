import { z } from "zod";

import { AgentTool, ToolContext } from "./agent-tools";
import { BookingService } from "../../booking/booking.service";

export interface CancelBookingToolInput {
  bookingId: string;
}

export class CancelBookingTool implements AgentTool<CancelBookingToolInput> {
  readonly name = "cancelBooking";

  readonly description =
    "Cancel an existing appointment for the current patient. Requires the booking id.";

  readonly schema = z.object({
    bookingId: z.uuid().describe("The id of the booking to cancel."),
  });

  constructor(private readonly bookingService: BookingService) {}

  execute(input: CancelBookingToolInput, context: ToolContext) {
    return this.bookingService.cancelBooking({
      bookingId: input.bookingId,
      customerId: context.customerId,
    });
  }
}
