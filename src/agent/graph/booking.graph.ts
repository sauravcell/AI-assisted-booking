import { START, END, StateGraph } from "@langchain/langgraph";

import { BookingState } from "../state/booking.state";

import { LLMNode } from "../nodes/llm.node";
import { RouterNode } from "../nodes/router.node";
import { ToolNode } from "../nodes/tool.node";

/**
 * Builds the Booking AI workflow.
 *
 * IMPORTANT:
 * LangGraph v1.x requires method chaining.
 * Do not call addNode()/addEdge() on the same mutable
 * variable because the generic node types won't update.
 */
export class BookingGraph {
  constructor(
    private readonly llm: LLMNode,
    private readonly router: RouterNode,
    private readonly tool: ToolNode,
  ) {}

  build() {
    return new StateGraph(BookingState)
      .addNode("llm", this.llm.execute.bind(this.llm))
      .addNode("tool", this.tool.execute.bind(this.tool))

      .addEdge(START, "llm")

      .addConditionalEdges("llm", this.router.route.bind(this.router), {
        tool: "tool",
        __end__: END,
      })

      .addEdge("tool", "llm")

      .compile();
  }
}
