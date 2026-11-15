import { z } from "zod";

import { AgentTool } from "./agent-tools";
import { BookingService } from "../../booking/booking.service";

export interface SearchDoctorsWithAvailabilityToolInput {
  keyword?: string;
  date?: string;
}

export class SearchDoctorsWithAvailabilityTool
  implements AgentTool<SearchDoctorsWithAvailabilityToolInput>
{
  readonly name = "searchDoctorsWithAvailability";

  readonly description =
    "Search doctors by name or specialization and get their open appointment slots in a single call. " +
    "Without a date, returns each matching doctor's next open slots within the upcoming week (up to 5 per doctor). " +
    "With a date (YYYY-MM-DD), returns only that day's open slots. " +
    "Only doctors with at least one open slot in range are returned. " +
    "Prefer this over searchDoctor + checkAvailability when the patient is asking who's available, not asking about a specific doctor they already named.";

  readonly schema = z.object({
    keyword: z
      .string()
      .optional()
      .describe(
        "Doctor name or specialization to search for. Omit to search all doctors.",
      ),
    date: z
      .string()
      .optional()
      .describe("Optional date to filter slots, formatted as YYYY-MM-DD."),
  });

  constructor(private readonly bookingService: BookingService) {}

  execute(input: SearchDoctorsWithAvailabilityToolInput) {
    return this.bookingService.searchDoctorsWithAvailability(input);
  }
}
