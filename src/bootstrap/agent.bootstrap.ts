import { ChatGroq } from "@langchain/groq";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatDeepSeek } from "@langchain/deepseek";
import { StructuredToolInterface } from "@langchain/core/tools";

import { config } from "../config";

import { AgentService } from "../agent/service/agent.service";

import { BookingGraph } from "../agent/graph/booking.graph";

import { LLMNode } from "../agent/nodes/llm.node";
import { RouterNode } from "../agent/nodes/router.node";
import { ToolNode } from "../agent/nodes/tool.node";

import { AIProvider } from "../agent/providers/ai-provider";
import { GroqProvider } from "../agent/providers/groq.provider";
import { OpenAIProvider } from "../agent/providers/openai.provider";
import { GeminiProvider } from "../agent/providers/gemini.provider";
import { DeepSeekProvider } from "../agent/providers/deepseek.provider";

import { ToolRegistry } from "../agent/registry/tool.registry";
import { ListSpecialtiesTool } from "../agent/tools/listSpecialties.tool";
import { SearchDoctorTool } from "../agent/tools/searchDoctor.tool";
import { CheckAvailabilityTool } from "../agent/tools/checkAvailability.tool";
import { CreateBookingTool } from "../agent/tools/createBooking.tool";
import { CancelBookingTool } from "../agent/tools/cancelBooking.tool";

import { DoctorService } from "../doctor/doctor.service";
import { DoctorRepository } from "../doctor/doctor.repository";
import { BookingService } from "../booking/booking.service";
import { BookingRepository } from "../booking/booking.repository";
import { toLangChainTools } from "../agent/adapters/langchain-tool.adapter";

/**
 * Builds the AIProvider for whichever model is selected via LLM_PROVIDER.
 *
 * Switching models is a restart-time decision (env var), not a runtime
 * one - only the selected provider's API key needs to be set in .env.
 */
function createProvider(langchainTools: StructuredToolInterface[]): AIProvider {
  switch (config.LLM_PROVIDER) {
    case "groq": {
      if (!config.GROQ_API_KEY || !config.GROQ_MODEL) {
        throw new Error(
          "LLM_PROVIDER=groq requires GROQ_API_KEY and GROQ_MODEL to be set.",
        );
      }

      const chat = new ChatGroq({
        apiKey: config.GROQ_API_KEY,
        model: config.GROQ_MODEL,
        temperature: 0,
      });

      return new GroqProvider(chat.bindTools(langchainTools));
    }

    case "openai": {
      if (!config.OPENAI_API_KEY || !config.OPENAI_MODEL) {
        throw new Error(
          "LLM_PROVIDER=openai requires OPENAI_API_KEY and OPENAI_MODEL to be set.",
        );
      }

      const chat = new ChatOpenAI({
        apiKey: config.OPENAI_API_KEY,
        model: config.OPENAI_MODEL,
        temperature: 0,
      });

      return new OpenAIProvider(chat.bindTools(langchainTools));
    }

    case "gemini": {
      if (!config.GEMINI_API_KEY || !config.GEMINI_MODEL) {
        throw new Error(
          "LLM_PROVIDER=gemini requires GEMINI_API_KEY and GEMINI_MODEL to be set.",
        );
      }

      const chat = new ChatGoogleGenerativeAI({
        apiKey: config.GEMINI_API_KEY,
        model: config.GEMINI_MODEL,
        temperature: 0,
      });

      return new GeminiProvider(chat.bindTools(langchainTools));
    }

    case "deepseek": {
      if (!config.DEEPSEEK_API_KEY || !config.DEEPSEEK_MODEL) {
        throw new Error(
          "LLM_PROVIDER=deepseek requires DEEPSEEK_API_KEY and DEEPSEEK_MODEL to be set.",
        );
      }

      /**
       * "deepseek-reasoner" does not support tool calling as of this
       * writing - use "deepseek-chat" (V3) for this agent.
       */
      const chat = new ChatDeepSeek({
        apiKey: config.DEEPSEEK_API_KEY,
        model: config.DEEPSEEK_MODEL,
        temperature: 0,
      });

      return new DeepSeekProvider(chat.bindTools(langchainTools));
    }
  }
}

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

  registry.register(new ListSpecialtiesTool(doctorService));
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
  const provider = createProvider(langchainTools);

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
