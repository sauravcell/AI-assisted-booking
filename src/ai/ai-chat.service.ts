import { HumanMessage } from "@langchain/core/messages";

import { logger } from "../shared/logger/logger";

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

    logger.debug(
      {
        customerId: request.customerId,
        conversationId: conversation.id,
      },
      "[ai-chat] resolved conversation",
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

    logger.debug(
      { conversationId: conversation.id, historyLength: messages.length },
      "[ai-chat] loaded conversation history",
    );
    logger.debug({ messages }, "[ai-chat] history sent to agent");

    /**
     * Invoke the AI agent.
     */
    const invokeStartedAt = Date.now();

    const result = await this.agentService.invoke({
      customerId: request.customerId,

      conversationId: conversation.id,

      messages,

      newMessages: [],

      toolResults: [],

      response: "",
    });

    logger.debug(
      {
        conversationId: conversation.id,
        durationMs: Date.now() - invokeStartedAt,
        newMessageCount: result.newMessages.length,
      },
      "[ai-chat] agent graph finished",
    );

    /**
     * result.newMessages contains:
     *
     * HumanMessage
     * AIMessage(tool call)
     * ToolMessage
     * AIMessage(final)
     *
     * The HumanMessage has already been
     * saved above, so skip it.
     */
    const generatedMessages = result.newMessages.filter(
      (message) => !(message instanceof HumanMessage),
    );
    await this.messageService.saveMany(
      toDatabaseMessages(conversation.id, generatedMessages),
    );

    logger.debug(
      { conversationId: conversation.id, savedCount: generatedMessages.length },
      "[ai-chat] persisted generated messages",
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
