import { HumanMessage } from "@langchain/core/messages";

import { AgentService } from "../agent/service/agent.service";

import { ConversationService } from "../conversation/conversation.service";
import { MessageService } from "../message/message.service";

import {
  toDatabaseMessages,
  toLangChainMessages,
} from "../agent/utils/message.mapper";

export interface ChatRequest {
  customerId: string;
  text: string;
}

export interface ChatResponse {
  conversationId: string;
  response: string;
}

export class AIChatService {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
    private readonly agentService: AgentService,
  ) {}

  async chat(request: ChatRequest): Promise<ChatResponse> {
    /**
     * Find or create conversation.
     */
    const conversation = await this.conversationService.findOrCreate(
      request.customerId,
    );

    /**
     * Persist the incoming user message first.
     */
    await this.messageService.saveMessage({
      conversationId: conversation.id,
      role: "user",
      content: request.text,
    });

    /**
     * Load conversation history.
     *
     * Since we just persisted the user message,
     * it will already be included here.
     */
    const history = await this.messageService.getConversationMessages(
      conversation.id,
    );

    /**
     * Convert DB messages into LangChain messages.
     */
    const messages = toLangChainMessages(history);

    /**
     * Invoke the AI agent.
     */
    const result = await this.agentService.invoke({
      customerId: request.customerId,

      conversationId: conversation.id,

      messages,

      newMessages: [],

      toolResults: [],

      response: "",
    });

    /**
     * Persist every message generated
     * during this execution.
     *
     * Example:
     * AI(tool call)
     * Tool
     * AI(final)
     */
    await this.messageService.saveMany(
      toDatabaseMessages(conversation.id, result.newMessages),
    );

    /**
     * Update last activity.
     */
    await this.conversationService.touch(conversation.id);

    return {
      conversationId: conversation.id,
      response: result.response,
    };
  }
}
