import { ChatGroq } from "@langchain/groq";

import { config } from "../config";

import { AgentService } from "../agent/service/agent.service";

import { BookingGraph } from "../agent/graph/booking.graph";

import { LLMNode } from "../agent/nodes/llm.node";
import { RouterNode } from "../agent/nodes/router.node";
import { ToolNode } from "../agent/nodes/tool.node";

import { GroqProvider } from "../agent/providers/groq.provider";

import { ToolRegistry } from "../agent/registry/tool.registry";
import { SearchDoctorTool } from "../agent/tools/searchDoctor.tool";
import { CheckAvailabilityTool } from "../agent/tools/checkAvailability.tool";
import { CreateBookingTool } from "../agent/tools/createBooking.tool";
import { CancelBookingTool } from "../agent/tools/cancelBooking.tool";

import { DoctorService } from "../doctor/doctor.service";
import { DoctorRepository } from "../doctor/doctor.repository";
import { BookingService } from "../booking/booking.service";
import { BookingRepository } from "../booking/booking.repository";
import { toLangChainTools } from "../agent/adapters/langchain-tool.adapter";

export function createAgent(): AgentService {
  /**
   * -------------------------
   * Services & repositories
   * -------------------------
   */
  const doctorRepository = new DoctorRepository();
  const doctorService = new DoctorService(doctorRepository);

  const bookingRepository = new BookingRepository();
  const bookingService = new BookingService(bookingRepository);

  /**
   * -------------------------
   * Registry
   * -------------------------
   */
  const registry = new ToolRegistry();

  registry.register(new SearchDoctorTool(doctorService));
  registry.register(new CheckAvailabilityTool(bookingService));
  registry.register(new CreateBookingTool(bookingService));
  registry.register(new CancelBookingTool(bookingService));

  /**
   * -------------------------
   * LangChain Tools
   * -------------------------
   */
  const langchainTools = toLangChainTools(registry.getAll());

  /**
   * -------------------------
   * LLM
   * -------------------------
   */
  const chat = new ChatGroq({
    apiKey: config.GROQ_API_KEY!,
    model: config.GROQ_MODEL,
    temperature: 0,
  });

  const provider = new GroqProvider(chat.bindTools(langchainTools));

  /**
   * -------------------------
   * Nodes
   * -------------------------
   */
  const llmNode = new LLMNode(provider);

  const routerNode = new RouterNode();

  const toolNode = new ToolNode(registry);

  /**
   * -------------------------
   * Graph
   * -------------------------
   */
  const graph = new BookingGraph(llmNode, routerNode, toolNode);

  return new AgentService(graph);
}

export const agent = createAgent();
