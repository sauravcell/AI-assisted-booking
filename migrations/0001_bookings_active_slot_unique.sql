-- Preserve booking history across cancel/rebook cycles.
--
-- bookings.availability_id was globally UNIQUE, so rebooking a
-- cancelled slot required UPDATE-ing the same row in place,
-- overwriting the original patient's booking record. This replaces
-- that constraint with a partial unique index that only enforces
-- uniqueness among ACTIVE (BOOKED) bookings for a slot, so each
-- booking gets its own permanent row and cancelled history is never
-- overwritten.
--
-- No backfill needed: availability_id was already UNIQUE, so the
-- existing data already has at most one row per slot.

BEGIN;

ALTER TABLE public.bookings
  DROP CONSTRAINT uq_booking_slot;

CREATE UNIQUE INDEX uq_booking_active_slot
  ON public.bookings (availability_id)
  WHERE status = 'BOOKED';

COMMIT;
