-- Composite indexes matching the query patterns introduced/used by
-- the AI tools, replacing the single-column indexes they make
-- redundant (a composite index already serves any query that only
-- filters on its leading column, so keeping both would just add
-- write overhead with no read benefit).
--
-- Not applied automatically - review and run against each
-- environment (dev/staging/prod) as appropriate.

BEGIN;

-- messages.findByConversationId: WHERE conversation_id = $1
-- ORDER BY created_at ASC. Replaces idx_message_conversation.
DROP INDEX IF EXISTS public.idx_message_conversation;

CREATE INDEX idx_message_conversation_created
  ON public.messages (conversation_id, created_at);

-- bookings.findByCustomerId (getMyBookings): WHERE customer_id = $1
-- [AND status = 'BOOKED']. Replaces idx_booking_customer.
DROP INDEX IF EXISTS public.idx_booking_customer;

CREATE INDEX idx_booking_customer_status
  ON public.bookings (customer_id, status);

-- conversations.findActiveByCustomerId: WHERE customer_id = $1
-- AND is_active = true. Replaces idx_conversation_customer.
DROP INDEX IF EXISTS public.idx_conversation_customer;

CREATE INDEX idx_conversation_customer_active
  ON public.conversations (customer_id, is_active);

COMMIT;
