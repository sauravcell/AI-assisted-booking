import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { AgentTool } from "../tools/agent-tools";

/**
 * Converts our internal AgentTools into
 * LangChain-compatible tools.
 */
export function toLangChainTools(agentTools: AgentTool[]) {
  return agentTools.map((agentTool) =>
    tool(
      async (input) => {
        return agentTool.execute(input);
      },
      {
        name: agentTool.name,

        description: agentTool.description,

        schema: agentTool.schema,
      },
    ),
  );
}
