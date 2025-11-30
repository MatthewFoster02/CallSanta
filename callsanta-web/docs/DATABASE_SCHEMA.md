# Database Schema

CallSanta uses Supabase (PostgreSQL) as its primary database. This document describes the database tables, relationships, and storage buckets.

## Tables Overview

| Table | Purpose |
|-------|---------|
| `calls` | Santa call bookings and details |
| `affiliates` | Affiliate program participants |
| `call_events` | Audit log for all call-related events |
| `pricing_config` | Dynamic pricing configuration |

---

## Calls Table

The primary table storing all booking and call information.

### Schema

```sql
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Child Information
  child_name VARCHAR(255) NOT NULL,
  child_age INTEGER NOT NULL,
  child_gender VARCHAR(50),
  child_nationality VARCHAR(100),
  child_info_text TEXT,
  child_info_voice_url TEXT,
  child_info_voice_transcript TEXT,

  -- Contact Information
  phone_number VARCHAR(50) NOT NULL,
  phone_country_code VARCHAR(10),
  parent_email VARCHAR(255) NOT NULL,

  -- Scheduling
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone VARCHAR(100),
  call_now BOOLEAN DEFAULT false,

  -- Pricing & Payment
  gift_budget INTEGER,
  base_amount_cents INTEGER NOT NULL,
  recording_amount_cents INTEGER DEFAULT 0,
  total_amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  recording_purchased BOOLEAN DEFAULT false,

  -- Stripe References
  stripe_checkout_session_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  payment_status VARCHAR(50) DEFAULT 'pending',

  -- Call Execution
  call_status VARCHAR(50) DEFAULT 'pending',
  twilio_call_sid VARCHAR(255),
  elevenlabs_conversation_id VARCHAR(255),
  call_started_at TIMESTAMP WITH TIME ZONE,
  call_ended_at TIMESTAMP WITH TIME ZONE,
  call_duration_seconds INTEGER,
  retry_count INTEGER DEFAULT 0,

  -- Recording & Video
  recording_url TEXT,
  transcript TEXT,
  transcript_sent_at TIMESTAMP WITH TIME ZONE,
  video_url TEXT,
  video_status VARCHAR(50) DEFAULT 'pending',

  -- Affiliate & Tracking
  affiliate_id UUID REFERENCES affiliates(id),
  utm_source VARCHAR(255),

  -- Email Tracking
  reminder_sent_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_calls_call_status ON calls(call_status);
CREATE INDEX idx_calls_payment_status ON calls(payment_status);
CREATE INDEX idx_calls_scheduled_at ON calls(scheduled_at);
CREATE INDEX idx_calls_affiliate_id ON calls(affiliate_id);
CREATE INDEX idx_calls_stripe_payment_intent ON calls(stripe_payment_intent_id);
CREATE INDEX idx_calls_elevenlabs_conversation ON calls(elevenlabs_conversation_id);
```

### Field Descriptions

#### Child Information

| Field | Type | Description |
|-------|------|-------------|
| `child_name` | VARCHAR(255) | Child's first name |
| `child_age` | INTEGER | Child's age in years |
| `child_gender` | VARCHAR(50) | Gender (boy/girl/other) |
| `child_nationality` | VARCHAR(100) | Nationality for cultural context |
| `child_info_text` | TEXT | Parent's written notes about the child |
| `child_info_voice_url` | TEXT | URL to parent's voice message (Supabase Storage) |
| `child_info_voice_transcript` | TEXT | Transcription of voice message |

#### Contact Information

| Field | Type | Description |
|-------|------|-------------|
| `phone_number` | VARCHAR(50) | Full phone number (E.164 format) |
| `phone_country_code` | VARCHAR(10) | ISO country code (US, GB, etc.) |
| `parent_email` | VARCHAR(255) | Parent's email for notifications |

#### Scheduling

| Field | Type | Description |
|-------|------|-------------|
| `scheduled_at` | TIMESTAMP | When the call should be made |
| `timezone` | VARCHAR(100) | Parent's timezone (e.g., America/New_York) |
| `call_now` | BOOLEAN | If true, call immediately after payment |

#### Pricing & Payment

| Field | Type | Description |
|-------|------|-------------|
| `gift_budget` | INTEGER | Budget for gifts (0-1000) |
| `base_amount_cents` | INTEGER | Base call price in cents |
| `recording_amount_cents` | INTEGER | Recording add-on price in cents |
| `total_amount_cents` | INTEGER | Total charge in cents |
| `currency` | VARCHAR(3) | ISO currency code (usd, eur, gbp) |
| `recording_purchased` | BOOLEAN | Whether recording was purchased |

#### Stripe References

| Field | Type | Description |
|-------|------|-------------|
| `stripe_checkout_session_id` | VARCHAR(255) | Stripe Checkout Session ID |
| `stripe_payment_intent_id` | VARCHAR(255) | Stripe PaymentIntent ID |
| `payment_status` | VARCHAR(50) | Payment state |

**payment_status values:**
- `pending` - Awaiting payment
- `paid` - Payment successful
- `failed` - Payment failed
- `refunded` - Payment refunded

#### Call Execution

| Field | Type | Description |
|-------|------|-------------|
| `call_status` | VARCHAR(50) | Current call state |
| `twilio_call_sid` | VARCHAR(255) | Twilio Call SID |
| `elevenlabs_conversation_id` | VARCHAR(255) | ElevenLabs conversation ID |
| `call_started_at` | TIMESTAMP | When call was answered |
| `call_ended_at` | TIMESTAMP | When call ended |
| `call_duration_seconds` | INTEGER | Call length in seconds |
| `retry_count` | INTEGER | Number of retry attempts |

**call_status values:**
- `pending` - Just created, awaiting payment
- `scheduled` - Payment confirmed, waiting for scheduled time
- `queued` - Call initiated via ElevenLabs
- `in_progress` - Call is active
- `completed` - Call finished successfully
- `failed` - Call failed (non-retryable)
- `no_answer` - No one answered
- `cancelled` - Cancelled by system or admin

#### Recording & Video

| Field | Type | Description |
|-------|------|-------------|
| `recording_url` | TEXT | URL to call audio (Supabase Storage) |
| `transcript` | TEXT | Full call transcript |
| `transcript_sent_at` | TIMESTAMP | When transcript email was sent |
| `video_url` | TEXT | URL to generated video (Supabase Storage) |
| `video_status` | VARCHAR(50) | Video render state |

**video_status values:**
- `pending` - Not yet rendered
- `processing` - Lambda is rendering
- `completed` - Video ready
- `failed` - Render failed

---

## Affiliates Table

Stores affiliate program participants.

### Schema

```sql
CREATE TABLE affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  public_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  payout_percent INTEGER DEFAULT 20,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_affiliates_slug ON affiliates(slug);
CREATE INDEX idx_affiliates_public_code ON affiliates(public_code);
CREATE INDEX idx_affiliates_email ON affiliates(email);
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `slug` | VARCHAR(100) | URL-friendly identifier (e.g., `johns-santa`) |
| `public_code` | VARCHAR(50) | Shareable code (e.g., `JOHNSSANTA`) |
| `name` | VARCHAR(255) | Affiliate's name |
| `email` | VARCHAR(255) | Contact email |
| `payout_percent` | INTEGER | Commission percentage (default 20%) |
| `is_active` | BOOLEAN | Whether affiliate can recruit |

### Usage

- Slug is used for landing pages: `/johns-santa`
- Public code is used for direct links: `/book?ref=JOHNSSANTA`
- `affiliate_id` in calls table links back for attribution

---

## Call Events Table

Audit log tracking all call-related events for debugging and analytics.

### Schema

```sql
CREATE TABLE call_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_call_events_call_id ON call_events(call_id);
CREATE INDEX idx_call_events_event_type ON call_events(event_type);
CREATE INDEX idx_call_events_created_at ON call_events(created_at);
```

### Event Types

| Event Type | Description |
|------------|-------------|
| `call_created` | Call record created |
| `payment_received` | Payment confirmed |
| `booking_confirmation_email_sent` | Confirmation email sent |
| `reminder_email_sent` | 1-hour reminder sent |
| `call_initiated` | Call started via ElevenLabs |
| `call_retry_scheduled` | Call failed, retry scheduled |
| `call_failed` | Call failed permanently |
| `post_call_transcription` | Transcript received |
| `post_call_audio` | Audio recording saved |
| `lambda_render_started` | Video render started |
| `lambda_render_failed` | Video render failed |
| `video_render_completed` | Video ready |
| `post_call_email_sent` | Final email with video sent |

### Example Event Data

```json
{
  "event_type": "call_initiated",
  "event_data": {
    "conversation_id": "conv_xxx",
    "call_sid": "CA_xxx",
    "phone_number": "+1555****567"
  }
}
```

---

## Pricing Config Table

Dynamic pricing configuration.

### Schema

```sql
CREATE TABLE pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN DEFAULT false,
  base_price_cents INTEGER NOT NULL,
  recording_addon_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pricing_config_active ON pricing_config(is_active);
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `is_active` | BOOLEAN | Only one row should be active |
| `base_price_cents` | INTEGER | Base call price (e.g., 499 for $4.99) |
| `recording_addon_cents` | INTEGER | Recording price (e.g., 299 for $2.99) |
| `currency` | VARCHAR(3) | ISO currency code |

### Usage

```sql
-- Get current pricing
SELECT * FROM pricing_config WHERE is_active = true LIMIT 1;

-- Update pricing (deactivate old, create new)
UPDATE pricing_config SET is_active = false WHERE is_active = true;
INSERT INTO pricing_config (is_active, base_price_cents, recording_addon_cents)
VALUES (true, 599, 299);
```

---

## Storage Buckets

CallSanta uses Supabase Storage for file storage.

### voice-recordings

Parent's optional voice messages about their child.

| Property | Value |
|----------|-------|
| Bucket Name | `voice-recordings` |
| Public | Yes |
| File Types | webm, mp3, wav, m4a |
| Naming | `{uuid}.{ext}` |

### call-recordings

Call audio recordings from ElevenLabs.

| Property | Value |
|----------|-------|
| Bucket Name | `call-recordings` |
| Public | Yes |
| File Types | mp3 |
| Naming | `{callId}.mp3` |

### call-videos

Generated video files from Remotion.

| Property | Value |
|----------|-------|
| Bucket Name | `call-videos` |
| Public | Yes |
| File Types | mp4 |
| Naming | `{callId}.mp4` |

---

## Row Level Security (RLS)

Supabase RLS policies control data access.

### Recommended Policies

```sql
-- Calls: Users can only read their own calls (by email)
CREATE POLICY "Users can read own calls"
ON calls FOR SELECT
USING (parent_email = auth.jwt() ->> 'email');

-- Affiliates: Public can read active affiliates
CREATE POLICY "Public can read active affiliates"
ON affiliates FOR SELECT
USING (is_active = true);

-- Call events: Same as calls
CREATE POLICY "Users can read own call events"
ON call_events FOR SELECT
USING (
  call_id IN (
    SELECT id FROM calls WHERE parent_email = auth.jwt() ->> 'email'
  )
);
```

**Note:** The service role key bypasses RLS for server-side operations.

---

## Migrations

Database migrations are stored in `supabase/migrations/`. To apply:

```bash
# Using Supabase CLI
supabase db push

# Or run SQL directly in Supabase Dashboard
```

---

## Queries Reference

### Get calls ready to be made

```sql
SELECT * FROM calls
WHERE call_status = 'scheduled'
  AND payment_status = 'paid'
  AND scheduled_at <= NOW()
  AND retry_count < 3
ORDER BY scheduled_at ASC;
```

### Get calls needing reminders

```sql
SELECT * FROM calls
WHERE call_status = 'scheduled'
  AND payment_status = 'paid'
  AND scheduled_at BETWEEN NOW() + INTERVAL '55 minutes'
                       AND NOW() + INTERVAL '65 minutes'
  AND reminder_sent_at IS NULL;
```

### Get affiliate earnings

```sql
SELECT
  a.id,
  a.name,
  a.slug,
  a.payout_percent,
  COUNT(c.id) as total_calls,
  COUNT(c.id) FILTER (WHERE c.payment_status = 'paid') as paid_calls,
  SUM(c.total_amount_cents) FILTER (WHERE c.payment_status = 'paid') as total_revenue,
  SUM(c.total_amount_cents * a.payout_percent / 100) FILTER (WHERE c.payment_status = 'paid') as earnings
FROM affiliates a
LEFT JOIN calls c ON c.affiliate_id = a.id
GROUP BY a.id, a.name, a.slug, a.payout_percent;
```

### Get call with events

```sql
SELECT
  c.*,
  COALESCE(
    json_agg(
      json_build_object(
        'event_type', ce.event_type,
        'event_data', ce.event_data,
        'created_at', ce.created_at
      ) ORDER BY ce.created_at
    ) FILTER (WHERE ce.id IS NOT NULL),
    '[]'
  ) as events
FROM calls c
LEFT JOIN call_events ce ON ce.call_id = c.id
WHERE c.id = 'uuid-here'
GROUP BY c.id;
```
