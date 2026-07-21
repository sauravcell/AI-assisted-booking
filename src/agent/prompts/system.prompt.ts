import { SystemMessage } from "@langchain/core/messages";

import { IDENTITY_PROMPT } from "./identity.prompt";
import { BEHAVIOR_PROMPT } from "./behavior.prompt";
import { BOOKING_PROMPT } from "./booking.prompt";
import { TOOL_RULES_PROMPT } from "./tool-rules.prompt";
import { MEMORY_PROMPT } from "./memory.prompt";
import { SAFETY_PROMPT } from "./safety.prompt";
import { FORMATTING_PROMPT } from "./formatting.prompt";
import { EXAMPLES_PROMPT } from "./examples.prompt";

export const SYSTEM_PROMPT = new SystemMessage(
  [
    IDENTITY_PROMPT,
    BEHAVIOR_PROMPT,
    BOOKING_PROMPT,
    MEMORY_PROMPT,
    TOOL_RULES_PROMPT,
    SAFETY_PROMPT,
    FORMATTING_PROMPT,
    EXAMPLES_PROMPT,
  ].join("\n\n"),
);
