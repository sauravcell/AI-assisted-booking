import { agent } from "./agent.bootstrap";

import { CustomerRepository } from "../customer/customer.repository";
import { CustomerService } from "../customer/customer.service";

import { ConversationRepository } from "../conversation/conversation.repository";
import { ConversationService } from "../conversation/conversation.service";

import { MessageRepository } from "../message/message.repository";
import { MessageService } from "../message/message.service";

import { AIChatService } from "../ai/ai-chat.service";

import { TelegramService } from "../telegram/telegram.service";
import { TelegramController } from "../telegram/telegram.controller";

const customerRepository = new CustomerRepository();

const customerService = new CustomerService(customerRepository);

const conversationRepository = new ConversationRepository();

const conversationService = new ConversationService(conversationRepository);

const messageRepository = new MessageRepository();

const messageService = new MessageService(messageRepository);

const aiChatService = new AIChatService(
  conversationService,
  messageService,
  agent,
);

const telegramService = new TelegramService(customerService, aiChatService);

export const telegramController = new TelegramController(telegramService);
