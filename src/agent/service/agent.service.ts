/**
 * Facade for the AI engine.
 *
 * Controllers never interact
 * with LangGraph directly.
 */
import { BookingAgentState } from "../state/booking.state";
import { BookingGraph } from "../graph/booking.graph";

export class AgentService {
  private readonly graph;

  constructor(bookingGraph: BookingGraph) {
    this.graph = bookingGraph.build();
  }

  invoke(state: BookingAgentState) {
    return this.graph.invoke({
      ...state,
      newMessages: [],
    });
  }

  getGraph() {
    return this.graph;
  }
}
/*
import { BookingGraph } from "../graph/booking.graph";
import { BookingAgentState } from "../state/booking.state";

export class AgentService {
  private readonly graph;

  constructor(bookingGraph: BookingGraph) {
    this.graph = bookingGraph.build();
  } 

  async invoke(state: BookingAgentState) {
    return this.graph.invoke(state);
  }
}
*/
