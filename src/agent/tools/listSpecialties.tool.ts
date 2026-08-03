import { z } from "zod";

import { AgentTool } from "./agent-tools";
import { DoctorService } from "../../doctor/doctor.service";

export type ListSpecialtiesToolInput = Record<string, never>;

export class ListSpecialtiesTool
  implements AgentTool<ListSpecialtiesToolInput, string[]>
{
  readonly name = "listSpecialties";

  readonly description =
    "Lists every medical specialty currently available at this hospital (e.g. Cardiology, Neurology, Dermatology). Call this before searchDoctor whenever the patient's request is based on a specialty or symptom rather than a specific doctor's name, so the search uses the hospital's exact specialty name instead of a guessed one. Not needed if the patient already named a doctor.";

  readonly schema = z.object({});

  constructor(private readonly doctorService: DoctorService) {}

  execute(_input: ListSpecialtiesToolInput) {
    return this.doctorService.listSpecialties();
  }
}
