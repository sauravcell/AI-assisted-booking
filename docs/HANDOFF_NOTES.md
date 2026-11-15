# Handoff Notes — AI Booking Platform

_Last updated: 2026-11-12 · Branch: `all_tools_implemented` · Status: discussion only, nothing implemented from this note yet._

Purpose: record what was reviewed and decided so the next session (human or AI tool) can continue without re-reading everything. Do not assume anything listed under "Open questions" — ask the owner.

---

## 1. Current system (what exists in `/src`)

- **Channel:** Telegram bot (webhook → `telegram/` → `ai/ai-chat.service.ts` → `agent/`).
- **Agent:** LangGraph loop `start → llm ⇄ tool → end` (`src/agent/graph/booking.graph.ts`, router decides tool vs end). The **LLM drives the conversation**.
- **Providers:** Groq, OpenAI, Gemini, DeepSeek, selected via `LLM_PROVIDER` (`src/bootstrap/agent.bootstrap.ts`).
- **Tools registered (7):** `listSpecialties`, `searchDoctor`, `searchDoctorsWithAvailability`, `checkAvailability`, `createBooking`, `cancelBooking`, `getMyBookings`.
  - `searchDoctorsWithAvailability` and `getMyBookings` are **uncommitted** (plus 11 modified files — see `git status`).
- **Layering:** tools → services → repositories → PostgreSQL. LLM never runs SQL.
- **Memory:** raw message history in Postgres only. No structured appointment state.
- **Safety rules** (confirm before booking, don't re-ask known info, never claim success without tool result) live **only in prompts** (`src/agent/prompts/`).
- **DB:** schema in `src/database/`; new `migrations/0001_bookings_active_slot_unique.sql` (prevents double-booking a slot) and `0002_indexes_for_ai_query_patterns.sql`; `ai_bookingsystem.sql` dump (untracked).
- **Observability:** LangSmith env vars configured in `src/config/index.ts`.
- **Identity:** Telegram chat ID = patient identity (no real authentication).
- **Testing:** effectively untested end-to-end — free-tier API rate limits blocked it.

## 2. Documentation inventory & staleness

| File | Content | Status |
|---|---|---|
| `ai_booking_agent_conversation.pages` | Original idea: AI **voice** booking agent (telephony, STT/TTS, 4 phases) | Historical — voice not started |
| `docs/beyond-booking-pattern.html` | Leadership doc: reusable "channel → understand → approved actions → system of record → reply" pattern | Fine (says 4 actions; now 7) |
| `docs/agent-folder-tour.html` | Plain-language tour of `src/agent/` | Mostly fine (4 tools; Groq-only) |
| `Executive Summary.pdf` | AI-generated review written **without seeing the code**; recommends planner, guardrails, memory, evals, telemetry, 12-week roadmap | Unreliable as a code description; useful as an idea list |
| `agent-wiring-guide.html` | Dev guide for telegram/ai/agent layers + how to add tools | **Stale** (written before 3 tools were built; 4 tools; Groq-only) |
| `docs/ai-agent-database-overview.html` | How LLM → tools → DB works, safety, file map | Partly stale (tool list, provider) |
| `graph.mmd` / `graph.png` | Generated LangGraph diagram | Current |
| `I am sharing 'conversation manager' with you.pdf` | ChatGPT discussion: model choice + Conversation Manager design (summarised in §3) | Current design input (untracked file) |

## 3. Key design input — "Conversation Manager" PDF (summary)

- **Models suggested:** Gemini 3.1 Flash-Lite (primary), Groq GPT-OSS-20B (alt), DeepSeek (cheap paid fallback).
- **Core principle:** "The LLM understands the conversation; the Conversation Manager controls its progress." LLM = intent/entity extraction + phrasing. Backend = validation, business rules, permissions, booking.
- **Controlled workflow with function calling, not an autonomous agent.** ~2–3 LLM calls per booking.
- **State machine (backend-owned):** `COLLECTING_DETAILS → READY_FOR_AVAILABILITY → CHECKING_AVAILABILITY → AWAITING_SLOT_SELECTION → AWAITING_CONFIRMATION → BOOKING_IN_PROGRESS → BOOKED`. "Yes" ≠ booked; only a successful booking API response moves to `BOOKED`.
- **Context:** structured appointment context (source of truth) + message history + summaries.
- **Follow-ups:** backend decides what's missing; LLM only words the question. Hospital rules (e.g. "afternoon" = 1–5 PM) are defined in code, not by the LLM.
- **Booking readiness checklist:** patient authenticated, department valid, date valid, slot selected, slot still free, explicit confirmation.
- **Confirmation:** stored pending-confirmation record tied to the exact slot; invalidated on any change; expires. Don't trust an LLM `confirmed: true` field.
- **Entities:** `Conversation` ≠ `AppointmentRequest` (one conversation can hold several requests, each with its own lifecycle).
- **Must handle:** idempotent booking, duplicate messages, expired confirmations, interrupted conversations, API failures.
- **Privacy:** synthetic data only on free tiers (free-tier data may be used for training).
- **Build order:** state lifecycle (no LLM) → extraction → follow-ups → availability → confirmation + idempotent booking → edge-case tests.

## 4. Gap: current code vs recommended design

| Area | Recommended | Current |
|---|---|---|
| Flow control | Backend state machine | LLM agent loop |
| Memory | Structured appointment context in DB | Raw message history |
| Confirmation | Stored, slot-bound, expiring record | Prompt instruction only |
| Double booking | Revalidate + idempotent booking | Partly (unique-slot index) |
| Multi-provider | Yes | ✅ Done |
| No direct SQL from LLM | Yes | ✅ Done |
| Authentication | Required | Telegram chat ID only |
| Duplicate message handling | Required | Not seen |
| Summary memory | Suggested | Not built |

## 5. Decisions made

1. **Goal:** this may reach **real clinics** → correctness must be enforced in code, not prompts.
2. **Channel:** **Telegram** for now (voice/WhatsApp deferred).
3. **Design direction (recommended, agreed in discussion):** move toward a **backend-controlled workflow (Conversation Manager)** with the LLM limited to extraction + phrasing. Reasons: real-clinic safety, ~half the LLM calls (rate limits), core logic testable without any LLM.
   - **Keep:** Telegram layer, customer handling, services/repositories, schema/migrations, provider abstraction, tool business logic.
   - **Change:** replace or shrink the LangGraph agent loop; add Conversation Manager (states, structured context, pending confirmations with expiry); rewrite prompts; add tables (e.g. `appointment_requests`, `pending_confirmations`, or state columns on `conversations`).
   - A lighter "hybrid" alternative was discussed (keep the agent, add code-enforced guardrails on `createBooking` + structured context). Not chosen, but available if the full rewrite proves too heavy.

## 6. Testing strategy (to work around rate limits)

- Unit-test state machine / transitions with no LLM.
- End-to-end tests with a fake LLM returning canned extraction results.
- Small set of real-LLM tests for extraction accuracy only.
- Optional: local Ollama to avoid rate limits.

## 7. Open questions (ask the owner — do not assume)

1. **Scope:** only booking / cancel / reschedule / list bookings, or also open-ended Q&A (symptom → specialty, clinic FAQs)? Affects whether a "free conversation" mode is needed alongside the state machine.
2. **Primary model:** Gemini suggested; owner will decide later.
3. **Patient authentication** approach beyond Telegram chat ID (needed for real clinics).
4. Whether to update or retire the stale HTML docs.
5. Whether to commit the currently uncommitted changes (2 new tools + 11 modified files + migrations) before starting the redesign.

## 8. Suggested next step

Discuss and agree (no code yet) on:
1. The state list and allowed transitions for Telegram.
2. Data model: `appointment_requests`, `pending_confirmations`, how they relate to existing `conversations` / `messages` / `bookings`.
3. What exactly the LLM extracts (fields, structured output schema).

Then implement in the PDF's build order, starting with the state lifecycle and its tests (no LLM).
