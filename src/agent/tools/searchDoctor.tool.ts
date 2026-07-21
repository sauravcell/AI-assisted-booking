import { z } from "zod";

import { AgentTool } from "./agent-tools";
import { DoctorService } from "../../doctor/doctor.service";

export interface SearchDoctorToolInput {
  keyword?: string;
}

export class SearchDoctorTool implements AgentTool<SearchDoctorToolInput> {
  readonly name = "searchDoctor";

  readonly description = "Search doctors by doctor name or specialization.";

  readonly schema = z.object({
    keyword: z.string().optional(),
  });

  constructor(private readonly doctorService: DoctorService) {}

  execute(input: SearchDoctorToolInput) {
    return this.doctorService.searchDoctors(input);
  }
}
