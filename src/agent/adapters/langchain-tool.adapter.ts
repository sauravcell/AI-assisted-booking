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
        /**
         * This callback only exists so LangChain can expose the tool's
         * schema to the LLM for function calling. Real execution always
         * happens in ToolNode via the ToolRegistry, which supplies the
         * authenticated customer context — this path never runs.
         */
        return agentTool.execute(input, { customerId: "" });
      },
      {
        name: agentTool.name,

        description: agentTool.description,

        schema: agentTool.schema,
      },
    ),
  );
}
