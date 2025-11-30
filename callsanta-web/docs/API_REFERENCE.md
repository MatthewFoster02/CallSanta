# API Reference

This document covers all API endpoints in the CallSanta application.

## Base URL

- **Development:** `http://localhost:3000/api`
- **Production:** `https://yourdomain.com/api`

## Authentication

Most endpoints are public. Admin endpoints require the `x-api-key` header matching `ADMIN_API_KEY`. Cron endpoints require `Authorization: Bearer {CRON_SECRET}`.

---

## Call Management

### Create Call

Creates a new Santa call booking.

```
POST /api/calls
Content-Type: multipart/form-data
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `data` | JSON string | Yes | Booking data (see schema below) |
| `voiceRecording` | File | No | Audio file (webm, mp3, wav) |

**Booking Data Schema:**

```json
{
  "childName": "Emma",
  "childAge": 7,
  "childGender": "girl",
  "childNationality": "American",
  "childInfoText": "Loves unicorns and drawing",
  "phoneNumber": "+15551234567",
  "phoneCountryCode": "US",
  "parentEmail": "parent@example.com",
  "scheduledAt": "2024-12-24T18:00:00Z",
  "timezone": "America/New_York",
  "callNow": false,
  "includeRecording": true,
  "giftBudget": 50,
  "affiliateId": "uuid-here"
}
```

**Response (200):**

```json
{
  "callId": "550e8400-e29b-41d4-a716-446655440000",
  "clientSecret": "pi_xxx_secret_xxx",
  "amount": 799,
  "currency": "usd",
  "checkoutUrl": "https://checkout.stripe.com/..."
}
```

**Errors:**

| Status | Description |
|--------|-------------|
| 400 | Invalid request data |
| 500 | Server error |

---

### Get Call

Retrieves details for a specific call.

```
GET /api/calls/{callId}
```

**Response (200):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "child_name": "Emma",
  "child_age": 7,
  "phone_number": "+15551234567",
  "scheduled_at": "2024-12-24T18:00:00Z",
  "call_status": "scheduled",
  "payment_status": "paid",
  "recording_purchased": true,
  "video_url": null,
  "video_status": "pending",
  "created_at": "2024-12-20T10:00:00Z"
}
```

**Errors:**

| Status | Description |
|--------|-------------|
| 404 | Call not found |
| 500 | Server error |

---

## Video Rendering

### Check Video Status

Gets the current video render status for a call.

```
GET /api/video/render?callId={callId}
```

**Response (200):**

```json
{
  "videoStatus": "completed",
  "videoUrl": "https://storage.supabase.co/...",
  "hasRecording": true,
  "recordingUrl": "https://storage.supabase.co/..."
}
```

---

### Queue Video Render

Manually queues a call for video rendering.

```
POST /api/video/render
Content-Type: application/json
```

**Request Body:**

```json
{
  "callId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Video render queued"
}
```

---

## Affiliate Management

### Create Affiliate

Registers a new affiliate.

```
POST /api/affiliates
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "John Smith",
  "email": "john@example.com",
  "slug": "johns-santa"
}
```

**Response (200):**

```json
{
  "affiliate": {
    "id": "uuid",
    "name": "John Smith",
    "email": "john@example.com",
    "slug": "johns-santa",
    "public_code": "JOHNSSANTA",
    "payout_percent": 20,
    "is_active": true,
    "created_at": "2024-12-20T10:00:00Z"
  },
  "links": {
    "booking": "https://yourdomain.com/johns-santa",
    "direct": "https://yourdomain.com/book?ref=JOHNSSANTA"
  }
}
```

**Errors:**

| Status | Description |
|--------|-------------|
| 400 | Invalid data or slug already taken |
| 500 | Server error |

---

### Check Slug Availability

Verifies if an affiliate slug is available.

```
GET /api/affiliates/check-slug?slug={slug}
```

**Response (200):**

```json
{
  "available": true,
  "message": "Slug is available"
}
```

```json
{
  "available": false,
  "message": "Slug is already taken"
}
```

---

### List Affiliates (Admin)

Lists all affiliates. Requires admin API key.

```
GET /api/affiliates
Headers:
  x-api-key: {ADMIN_API_KEY}
Query:
  active: true|false (optional)
```

**Response (200):**

```json
[
  {
    "id": "uuid",
    "name": "John Smith",
    "email": "john@example.com",
    "slug": "johns-santa",
    "public_code": "JOHNSSANTA",
    "payout_percent": 20,
    "is_active": true,
    "created_at": "2024-12-20T10:00:00Z"
  }
]
```

---

### Affiliate Report (Admin)

Gets earnings report for affiliates. Requires admin API key.

```
GET /api/affiliates/report
Headers:
  x-api-key: {ADMIN_API_KEY}
```

**Response (200):**

```json
[
  {
    "id": "uuid",
    "name": "John Smith",
    "slug": "johns-santa",
    "total_calls": 25,
    "paid_calls": 20,
    "total_earnings_cents": 4000,
    "payout_percent": 20
  }
]
```

---

## Cron Jobs

These endpoints are called by Vercel Cron. They require Bearer token authentication.

### Schedule Calls

Initiates calls that are due to be made.

```
GET /api/cron/schedule-calls
Headers:
  Authorization: Bearer {CRON_SECRET}
```

**Logic:**
- Finds calls with `call_status = 'scheduled'`, `payment_status = 'paid'`, `scheduled_at <= NOW()`, `retry_count < 3`
- Calls ElevenLabs API to initiate each call
- Updates call status to 'queued'

**Response (200):**

```json
{
  "processed": 3,
  "success": 2,
  "failed": 1,
  "results": [
    { "callId": "uuid-1", "success": true },
    { "callId": "uuid-2", "success": true },
    { "callId": "uuid-3", "success": false, "error": "Rate limited" }
  ]
}
```

---

### Send Reminders

Sends 1-hour reminder emails for upcoming calls.

```
GET /api/cron/send-reminders
Headers:
  Authorization: Bearer {CRON_SECRET}
```

**Logic:**
- Finds calls scheduled 55-65 minutes from now
- Sends reminder email to parent
- Marks reminder as sent

**Response (200):**

```json
{
  "processed": 5,
  "success": 5,
  "failed": 0,
  "results": [
    { "callId": "uuid-1", "success": true },
    { "callId": "uuid-2", "success": true }
  ]
}
```

---

## Webhooks

These endpoints receive events from external services.

### Stripe Webhook

Receives payment events from Stripe.

```
POST /api/webhooks/stripe
Headers:
  Stripe-Signature: {signature}
```

**Events Handled:**

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Mark call as paid, initiate if `call_now` |
| `payment_intent.succeeded` | Mark call as paid, initiate if `call_now` |
| `payment_intent.payment_failed` | Mark payment as failed |

**Response:** 200 OK (or 400 for invalid signature)

---

### ElevenLabs Webhook

Receives call events from ElevenLabs.

```
POST /api/webhooks/elevenlabs
Headers:
  X-Signature: {hmac-sha256-signature}
```

**Events Handled:**

| Event Type | Action |
|------------|--------|
| `post_call_transcription` | Store transcript, update call status |
| `post_call_audio` | Upload recording, trigger video render |
| `call_initiation_failure` | Handle retry logic or mark as failed |

**Request Body (post_call_transcription):**

```json
{
  "type": "post_call_transcription",
  "data": {
    "conversation_id": "conv_xxx",
    "transcript": "Ho ho ho! Hello Emma!...",
    "analysis": {
      "call_successful": true,
      "summary": "Great conversation about unicorns"
    },
    "metadata": {
      "call_duration_secs": 180
    }
  }
}
```

**Request Body (post_call_audio):**

```json
{
  "type": "post_call_audio",
  "data": {
    "conversation_id": "conv_xxx",
    "recording_url": "base64-encoded-mp3-data"
  }
}
```

**Response:** 200 OK

---

### Remotion Webhook

Receives video render completion events from AWS Lambda.

```
POST /api/webhooks/remotion
```

**Request Body (success):**

```json
{
  "type": "success",
  "renderId": "render_xxx",
  "bucketName": "remotionlambda-xxx",
  "outputFile": "renders/xxx.mp4",
  "customData": {
    "callId": "uuid",
    "childName": "Emma",
    "parentEmail": "parent@example.com",
    "audioUrl": "https://..."
  }
}
```

**Request Body (error):**

```json
{
  "type": "error",
  "renderId": "render_xxx",
  "errors": [
    {
      "message": "Render timeout",
      "stack": "..."
    }
  ],
  "customData": {
    "callId": "uuid"
  }
}
```

**Response:** 200 OK

---

## Error Response Format

All API errors follow this format:

```json
{
  "error": "Error message here",
  "details": "Optional additional details"
}
```

Common HTTP status codes:

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Missing or invalid authentication |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error - Something went wrong |

---

## Rate Limits

- Standard API routes: No explicit rate limiting (Vercel limits apply)
- Cron endpoints: Called by Vercel Cron only
- Webhook endpoints: Should handle burst traffic from external services

## File Locations

| Endpoint | Source File |
|----------|-------------|
| `/api/calls` | `src/app/api/calls/route.ts` |
| `/api/calls/[callId]` | `src/app/api/calls/[callId]/route.ts` |
| `/api/video/render` | `src/app/api/video/render/route.ts` |
| `/api/affiliates` | `src/app/api/affiliates/route.ts` |
| `/api/affiliates/check-slug` | `src/app/api/affiliates/check-slug/route.ts` |
| `/api/affiliates/report` | `src/app/api/affiliates/report/route.ts` |
| `/api/cron/schedule-calls` | `src/app/api/cron/schedule-calls/route.ts` |
| `/api/cron/send-reminders` | `src/app/api/cron/send-reminders/route.ts` |
| `/api/webhooks/stripe` | `src/app/api/webhooks/stripe/route.ts` |
| `/api/webhooks/elevenlabs` | `src/app/api/webhooks/elevenlabs/route.ts` |
| `/api/webhooks/remotion` | `src/app/api/webhooks/remotion/route.ts` |
