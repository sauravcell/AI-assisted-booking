import { z } from "zod";

import { AgentTool, ToolContext } from "./agent-tools";
import { BookingService } from "../../booking/booking.service";

export interface CheckAvailabilityToolInput {
  doctorId: string;
  date?: string;
}

export class CheckAvailabilityTool
  implements AgentTool<CheckAvailabilityToolInput>
{
  readonly name = "checkAvailability";

  readonly description =
    "Check a doctor's open appointment slots. Requires the doctor's id from a previous searchDoctor result. Optionally filter to one date (YYYY-MM-DD).";

  readonly schema = z.object({
    doctorId: z
      .uuid()
      .describe("The doctor's id, from a previous searchDoctor result."),
    date: z
      .string()
      .optional()
      .describe("Optional date to filter slots, formatted as YYYY-MM-DD."),
  });

  constructor(private readonly bookingService: BookingService) {}

  execute(input: CheckAvailabilityToolInput, _context: ToolContext) {
    return this.bookingService.checkAvailability(input);
  }
}
