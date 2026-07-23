# AI Booking Platform — File Tree

A file-by-file map of the project, with each file's purpose noted in brackets.
Generated 2026-07-22.

```
ai-booking-platform/
├── package.json                            [npm scripts + dependencies — express, langgraph, groq, pg, zod, pino]
├── tsconfig.json                           [TypeScript compiler configuration]
│
├── docs/                                   [Documentation for this project]
│   ├── ai-agent-database-overview.html     [Technical doc: how the AI agent talks to Postgres]
│   ├── agent-folder-tour.html              [Plain-language tour of the agent/ folder]
│   └── project-file-tree.md                [This file]
│
└── src/
    ├── app.ts                              [Express app setup — CORS, JSON body parsing, mounts /api routes]
    ├── server.ts                           [Entry point — checks DB connectivity, starts the HTTP server]
    │
    ├── config/
    │   └── index.ts                        [Loads and validates all environment variables (.env) with Zod]
    │
    ├── routes/
    │   └── index.ts                        [Top-level Express router — mounts /v1/webhook]
    │
    ├── shared/
    │   └── logger/
    │       └── logger.ts                   [Pino logger setup, pretty-printed in development]
    │
    ├── bootstrap/                          [Composition root — wires classes together at startup]
    │   ├── agent.bootstrap.ts              [Builds the AI agent: registers tools, LLM, graph — exports `agent`]
    │   └── telegram.bootstrap.ts           [Wires Telegram-facing services — customer, conversation, message, chat]
    │
    ├── ai/
    │   └── ai-chat.service.ts              [One chat turn: save message → load history → invoke agent → persist reply]
    │
    ├── agent/                              [The AI decision-making layer — see docs/agent-folder-tour.html]
    │   ├── adapters/
    │   │   └── langchain-tool.adapter.ts   [Converts internal AgentTool objects into LangChain tool definitions]
    │   │
    │   ├── graph/
    │   │   └── booking.graph.ts            [Defines the LangGraph state machine — the llm ⇄ tool loop]
    │   │
    │   ├── nodes/
    │   │   ├── llm.node.ts                 [Calls the LLM with the system prompt + conversation history]
    │   │   ├── router.node.ts              [Decides whether to run a tool next or end the turn]
    │   │   └── tool.node.ts                [Validates tool-call arguments and executes the requested tool]
    │   │
    │   ├── prompts/                        [The AI's written instructions, split into focused fragments]
    │   │   ├── system.prompt.ts            [Combines every fragment below into one system message]
    │   │   ├── identity.prompt.ts          [Who the assistant is — friendly medical booking assistant]
    │   │   ├── behavior.prompt.ts          [Conversation style — concise, one question at a time]
    │   │   ├── booking.prompt.ts           [Step-by-step booking / cancellation / reschedule workflow]
    │   │   ├── memory.prompt.ts            [Rules for using conversation history + resolving pronouns]
    │   │   ├── tool-rules.prompt.ts        [When tools must be used; never invent data]
    │   │   ├── safety.prompt.ts            [Never fabricate info or claim an unconfirmed booking]
    │   │   ├── formatting.prompt.ts        [Response tone/length; hide internal tool-call details]
    │   │   └── examples.prompt.ts          [Few-shot examples of expected assistant behavior]
    │   │
    │   ├── providers/
    │   │   ├── ai-provider.ts              [AIProvider interface — abstraction over any LLM vendor]
    │   │   ├── groq.provider.ts            [Concrete AIProvider implementation using Groq]
    │   │   └── testGroqProvider.ts         [Manual test script — sends one message straight to Groq]
    │   │
    │   ├── registry/
    │   │   └── tool.registry.ts            [Looks up a registered tool implementation by name]
    │   │
    │   ├── service/
    │   │   └── agent.service.ts            [Public entry point to the agent — wraps graph.invoke()]
    │   │
    │   ├── state/
    │   │   └── booking.state.ts            [Shared state shape passed between graph nodes for one turn]
    │   │
    │   ├── tools/                          [The concrete actions the AI is allowed to request]
    │   │   ├── agent-tools.ts              [AgentTool interface + ToolContext contract every tool implements]
    │   │   ├── searchDoctor.tool.ts         [Tool: search doctors by name or specialization]
    │   │   ├── checkAvailability.tool.ts   [Tool: list a doctor's open appointment slots]
    │   │   ├── createBooking.tool.ts       [Tool: book an appointment slot for the current patient]
    │   │   └── cancelBooking.tool.ts       [Tool: cancel an existing appointment]
    │   │
    │   └── utils/
    │       └── message.mapper.ts           [Converts between saved DB messages and LangChain message objects]
    │
    ├── booking/
    │   ├── booking.repository.ts           [Raw SQL — availability lookup, atomic book/cancel transactions]
    │   ├── booking.service.ts              [Business logic layer — delegates to the repository, no SQL]
    │   └── booking.types.ts                [Booking + availability entity types, tool result shapes]
    │
    ├── doctor/
    │   ├── doctor.repository.ts            [Raw SQL — list all / find by id / search doctors]
    │   ├── doctor.service.ts               [Business logic — specialization alias mapping, search fallback]
    │   ├── doctor.types.ts                 [Doctor entity + SearchDoctorInput type]
    │   └── testDoctorRepository.ts         [Manual test script — prints every doctor to the console]
    │
    ├── customer/
    │   ├── customer.repository.ts          [Raw SQL — find/create a customer by Telegram chat id]
    │   ├── customer.service.ts             [Business logic wrapper around CustomerRepository]
    │   ├── customer.types.ts               [Customer entity + CreateCustomer input type]
    │   └── testCustomerRepository.ts       [Manual test script placeholder]
    │
    ├── conversation/
    │   ├── conversation.repository.ts      [Raw SQL — find/create/touch/close a conversation]
    │   ├── conversation.service.ts         [Business logic wrapper around ConversationRepository]
    │   └── conversation.types.ts           [Conversation entity + CreateConversation input type]
    │
    ├── message/
    │   ├── message.repository.ts           [Raw SQL — insert/find/delete messages, batch insert]
    │   ├── message.service.ts              [Business logic wrapper around MessageRepository]
    │   └── message.types.ts                [Message entity, MessageRole union, CreateMessage type]
    │
    ├── telegram/
    │   ├── telegram.controller.ts          [Express handler for the Telegram webhook endpoint]
    │   ├── telegram.routes.ts              [Express router — POST /telegram]
    │   ├── telegram.service.ts             [Handles incoming updates — resolves customer, calls AIChatService, replies]
    │   └── telegram.types.ts               [Telegram update/message/chat/user payload shapes]
    │
    ├── database/
    │   ├── database.ts                     [Postgres connection pool (pg.Pool) + date type-parser fix]
    │   ├── testConnection.ts               [Startup check — runs SELECT NOW() to confirm DB connectivity]
    │   ├── 001_create_database.sql         [DB creation script — currently empty]
    │   ├── 002_create_schema.sql           [Table schema script — currently empty]
    │   └── 003_seed_data.sql               [Seed data script — currently empty]
    │
    └── scripts/
        └── test-agent.ts                  [CLI script — runs a single prompt through the full agent pipeline]
```

## Notes

- **Layering pattern**, repeated across `booking/`, `doctor/`, `customer/`, `conversation/`, `message/`:
  `*.repository.ts` (raw SQL) → `*.service.ts` (business logic, no SQL) → `*.types.ts` (shared shapes).
- The three `.sql` files under `database/` are currently empty — schema setup appears to happen elsewhere or hasn't been checked in yet.
- Files named `test*.ts` (`testConnection.ts`, `testCustomerRepository.ts`, `testDoctorRepository.ts`, `testGroqProvider.ts`, `scripts/test-agent.ts`) are manual/ad-hoc scripts run via `tsx`, not an automated test suite — `package.json`'s `"test"` script is still the default placeholder.
