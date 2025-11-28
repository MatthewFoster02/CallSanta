-- Add call_now column to calls table
-- When true, the Stripe webhook initiates the call immediately (skipping the cron)

ALTER TABLE calls ADD COLUMN call_now BOOLEAN DEFAULT FALSE;
