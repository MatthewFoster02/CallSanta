# Architecture

This document describes the system architecture, data flow, and service interactions in CallSanta.

## System Overview

CallSanta is a full-stack Next.js application that orchestrates multiple external services to deliver personalized Santa phone calls. The architecture follows a serverless-first approach with Vercel hosting the main application and AWS Lambda handling video rendering.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  /book      │  │  /success   │  │  /recording │  │  /[affiliate]│    │
│  │  Booking    │  │  Payment    │  │  Video      │  │  Affiliate   │    │
│  │  Wizard     │  │  Success    │  │  Playback   │  │  Landing     │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API ROUTES (Vercel)                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │ /api/    │  │ /api/    │  │ /api/    │  │ /api/    │                │
│  │ calls    │  │ webhooks │  │ cron     │  │ video    │                │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘                │
└─────────────────────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SERVICES                               │
│                                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Supabase │  │  Stripe  │  │ElevenLabs│  │  Resend  │  │AWS Lambda│ │
│  │ Database │  │ Payments │  │ AI Voice │  │  Email   │  │  Video   │ │
│  │ Storage  │  │          │  │ + Twilio │  │          │  │ Render   │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

## Core Data Flow

### Complete User Journey

```
1. BOOKING PHASE
   ════════════════════════════════════════════════════════════════════

   User visits /book
        │
        ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │ BookingWizard Component                                         │
   │                                                                  │
   │  Step 1: Child Info                                             │
   │    - Name, age, gender                                          │
   │    - Optional: text about child                                 │
   │    - Optional: voice recording (VoiceRecorder component)        │
   │                                                                  │
   │  Step 2: Schedule                                               │
   │    - Date and time picker                                       │
   │    - Timezone detection                                         │
   │    - "Call Now" option                                          │
   │                                                                  │
   │  Step 3: Parent Info                                            │
   │    - Phone number (where Santa calls)                           │
   │    - Email (for confirmations)                                  │
   │    - Gift budget (optional, influences conversation)            │
   │                                                                  │
   │  Step 4: Review & Payment                                       │
   │    - Summary of booking                                         │
   │    - Add recording option (+$2.99)                              │
   │    - Stripe payment form                                        │
   └─────────────────────────────────────────────────────────────────┘
        │
        │ Submit (FormData with optional voice file)
        ▼
   POST /api/calls
        │
        ├─► Validate data (Zod schema)
        │
        ├─► Upload voice recording to Supabase Storage
        │   (if provided)
        │
        ├─► Transcribe voice message via ElevenLabs
        │   (for Santa conversation context)
        │
        ├─► Fetch active pricing from database
        │
        ├─► Create call record in database
        │   (status: 'pending', payment_status: 'pending')
        │
        ├─► Create Stripe PaymentIntent
        │
        └─► Return { callId, clientSecret, checkoutUrl }


2. PAYMENT PHASE
   ════════════════════════════════════════════════════════════════════

   User completes payment in UI
        │
        ├─► Stripe processes card
        │
        └─► Stripe sends webhook
                │
                ▼
   POST /api/webhooks/stripe
        │
        ├─► Verify Stripe signature
        │
        ├─► Extract callId from metadata
        │
        ├─► Update call:
        │   - payment_status: 'paid'
        │   - stripe_payment_intent_id
        │
        ├─► If call_now=true:
        │   └─► Initiate call immediately (skip to step 3)
        │
        ├─► If call_now=false:
        │   └─► Set call_status: 'scheduled'
        │
        ├─► Send booking confirmation email (Resend)
        │
        ├─► Send Discord notification
        │
        └─► Log call_event: 'payment_received'


3. CALL EXECUTION PHASE
   ════════════════════════════════════════════════════════════════════

   Vercel Cron (every 1 minute)
        │
        ▼
   GET /api/cron/schedule-calls
        │
        ├─► Query calls WHERE:
        │   - call_status = 'scheduled'
        │   - payment_status = 'paid'
        │   - scheduled_at <= NOW()
        │   - retry_count < 3
        │
        ├─► For each call:
        │   │
        │   ├─► Call ElevenLabs API: initiateCall()
        │   │   │
        │   │   ├─► Inject dynamic variables:
        │   │   │   - child_name
        │   │   │   - child_age
        │   │   │   - child_info_text
        │   │   │   - child_info_voice_transcript
        │   │   │   - gift_budget
        │   │   │
        │   │   └─► ElevenLabs triggers Twilio call
        │   │
        │   ├─► Update call:
        │   │   - call_status: 'queued'
        │   │   - elevenlabs_conversation_id
        │   │   - twilio_call_sid
        │   │
        │   └─► Log call_event: 'call_initiated'
        │
        └─► Return { processed, success, failed }


4. CALL IN PROGRESS
   ════════════════════════════════════════════════════════════════════

   Phone rings at parent's number
        │
        ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │ ElevenLabs Conversational AI Agent                              │
   │                                                                  │
   │  - Plays Santa's voice                                          │
   │  - Uses context from booking (child name, interests, budget)    │
   │  - Natural back-and-forth conversation                          │
   │  - Suggests gifts based on budget                               │
   │  - Records entire conversation                                  │
   │                                                                  │
   └─────────────────────────────────────────────────────────────────┘
        │
        │ Call ends
        ▼
   ElevenLabs sends webhooks...


5. POST-CALL PROCESSING
   ════════════════════════════════════════════════════════════════════

   POST /api/webhooks/elevenlabs
        │
        ├─► Event: 'post_call_transcription'
        │   │
        │   ├─► Extract transcript, call_duration, analysis
        │   │
        │   ├─► Update call:
        │   │   - call_status: 'completed' (or 'failed')
        │   │   - transcript
        │   │   - call_duration_seconds
        │   │   - call_ended_at
        │   │
        │   ├─► If NO recording purchased:
        │   │   └─► Send post-call email with transcript only
        │   │
        │   └─► Log call_event: 'post_call_transcription'
        │
        │
        ├─► Event: 'post_call_audio'
        │   │
        │   ├─► Decode base64 audio (MP3)
        │   │
        │   ├─► Upload to Supabase Storage (call-recordings bucket)
        │   │
        │   ├─► Update call:
        │   │   - recording_url
        │   │
        │   ├─► Trigger video rendering:
        │   │   └─► POST /api/video/render OR direct Lambda call
        │   │
        │   └─► Log call_event: 'post_call_audio'
        │
        │
        └─► Event: 'call_initiation_failure'
            │
            ├─► Map failure reason (busy, no-answer, etc.)
            │
            ├─► If retryable (busy, no-answer):
            │   ├─► Reset call_status: 'scheduled'
            │   ├─► Increment retry_count
            │   └─► (Cron will retry next run)
            │
            ├─► If final failure:
            │   └─► Update call_status: 'failed'
            │
            └─► Log call_event: 'call_failed' or 'call_retry_scheduled'


6. VIDEO GENERATION PHASE
   ════════════════════════════════════════════════════════════════════

   Video render triggered (Lambda or worker)
        │
        ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │ AWS Lambda (Remotion Lambda)                                    │
   │                                                                  │
   │  Input:                                                         │
   │    - audioUrl (call recording from Supabase)                    │
   │    - childName                                                  │
   │    - waveformData (extracted from audio)                        │
   │                                                                  │
   │  Renders SantaCallVideo composition:                            │
   │    - 1080x1920 (9:16 vertical for TikTok/Reels)                │
   │    - 60 FPS                                                     │
   │    - Festive background animation                               │
   │    - Santa avatar with pulsing ring                             │
   │    - "Calling [Child Name]..." text                             │
   │    - Audio waveform visualization                               │
   │    - Call timer                                                 │
   │                                                                  │
   │  Output: MP4 file to S3                                         │
   └─────────────────────────────────────────────────────────────────┘
        │
        │ Lambda completes
        ▼
   POST /api/webhooks/remotion
        │
        ├─► Verify Remotion signature
        │
        ├─► Download video from S3
        │
        ├─► Upload to Supabase Storage (call-videos bucket)
        │
        ├─► Update call:
        │   - video_url
        │   - video_status: 'completed'
        │
        ├─► Send post-call email with video link
        │
        └─► Log call_event: 'video_render_completed'


7. EMAIL NOTIFICATIONS
   ════════════════════════════════════════════════════════════════════

   Emails sent at various stages:

   ┌─────────────────┬────────────────────────────────────────────────┐
   │ Trigger         │ Email Content                                  │
   ├─────────────────┼────────────────────────────────────────────────┤
   │ Payment success │ Booking confirmation with details              │
   │ 1 hour before   │ Reminder that Santa will call soon             │
   │ Call completed  │ Transcript summary (if no recording purchased) │
   │ Video ready     │ Link to view/download video                    │
   └─────────────────┴────────────────────────────────────────────────┘

   Reminder email cron: GET /api/cron/send-reminders (every 5 min)
        │
        ├─► Query calls WHERE:
        │   - call_status = 'scheduled'
        │   - scheduled_at BETWEEN now+55min AND now+65min
        │   - reminder_sent_at IS NULL
        │
        ├─► For each call:
        │   ├─► Send reminder email
        │   ├─► Update reminder_sent_at
        │   └─► Log call_event: 'reminder_email_sent'
        │
        └─► Return { processed, success, failed }
```

## State Machines

### Call Status

```
                    ┌─────────────────────────────────────────────────┐
                    │                                                  │
                    ▼                                                  │
               ┌─────────┐                                            │
      create   │ pending │                                            │
      ─────►   └────┬────┘                                            │
                    │                                                  │
                    │ payment confirmed                               │
                    ▼                                                  │
              ┌───────────┐                                           │
              │ scheduled │◄──────────────────────────────────────────┤
              └─────┬─────┘                                           │
                    │                                                  │
                    │ cron initiates call                             │
                    ▼                                                  │
               ┌─────────┐                                            │
               │ queued  │                                            │
               └────┬────┘                                            │
                    │                                                  │
          ┌────────┴────────┐                                         │
          │                  │                                         │
          ▼                  ▼                                         │
   ┌─────────────┐    ┌───────────┐                                   │
   │ in_progress │    │  failed   │──► retryable? ──► yes ────────────┘
   └──────┬──────┘    │ no_answer │
          │           │ cancelled │
          │           └───────────┘
          ▼
    ┌───────────┐
    │ completed │
    └───────────┘
```

### Payment Status

```
         ┌─────────┐
create   │ pending │
─────►   └────┬────┘
              │
              │ stripe webhook
              ▼
         ┌─────────┐
         │  paid   │
         └────┬────┘
              │
              │ (optional)
              ▼
        ┌──────────┐
        │ refunded │
        └──────────┘
```

### Video Status

```
         ┌─────────┐
trigger  │ pending │
─────►   └────┬────┘
              │
              │ lambda starts
              ▼
        ┌────────────┐
        │ processing │
        └─────┬──────┘
              │
     ┌────────┴────────┐
     │                  │
     ▼                  ▼
┌───────────┐     ┌─────────┐
│ completed │     │ failed  │
└───────────┘     └─────────┘
```

## Service Integration Details

### ElevenLabs Integration

ElevenLabs provides the conversational AI agent that acts as Santa during calls.

**Outbound Call Flow:**
1. Our API calls ElevenLabs with phone number + context
2. ElevenLabs coordinates with Twilio to place the call
3. When answered, ElevenLabs streams Santa's voice
4. ElevenLabs processes child's speech in real-time
5. Agent uses provided context (name, age, interests) for personalization
6. Call is recorded by ElevenLabs

**Dynamic Variables Passed:**
- `child_name` - For personalized greeting
- `child_age` - Age-appropriate conversation
- `child_info_text` - Parent's notes about child
- `child_info_voice_transcript` - Transcribed voice message
- `gift_budget` - Influences gift suggestions ($0-1000)

**Webhook Events Received:**
- `post_call_transcription` - Complete transcript + analysis
- `post_call_audio` - Base64-encoded MP3 recording
- `call_initiation_failure` - Call didn't connect

### Stripe Integration

Stripe handles all payment processing.

**Payment Flow:**
1. Create PaymentIntent when booking submitted
2. Frontend uses Stripe Elements for card input
3. Stripe processes payment
4. Webhook confirms success/failure
5. Update call record accordingly

**Products:**
- Base Santa Call - One-time payment
- Recording Add-on - Optional additional charge

### Remotion Video Generation

Remotion creates shareable video clips from call recordings.

**Composition Structure:**
```
SantaCallVideo
├── Background (animated festive theme)
├── SantaAvatar (Santa emoji with pulse animation)
├── CallingLabel (child's name + status)
├── Waveform (audio visualization bars)
├── CallTimer (elapsed time counter)
└── Logo (watermark)
```

**Render Pipeline:**
1. Audio URL passed to Lambda
2. Lambda downloads audio, extracts waveform data
3. Remotion renders frames at 60 FPS
4. H.264 encoding to MP4
5. Upload to S3
6. Webhook notifies completion
7. Transfer to Supabase Storage

## Security Architecture

### Authentication & Authorization

- **Supabase RLS** - Row-level security on all tables
- **Service Role Key** - Used only server-side for admin operations
- **Anon Key** - Client-side with limited permissions

### Webhook Verification

| Service | Verification Method |
|---------|---------------------|
| Stripe | HMAC-SHA256 signature in `Stripe-Signature` header |
| ElevenLabs | HMAC-SHA256 signature in `X-Signature` header |
| Remotion | Signature verification via `validateWebhookSignature()` |

### Cron Job Security

- Bearer token in `Authorization` header
- Token matches `CRON_SECRET` environment variable
- Reject requests without valid token

### Data Protection

- All traffic over HTTPS
- PII masked in Discord notifications
- Sensitive data stored only in Supabase (encrypted at rest)
- No credit card data stored (handled by Stripe)

## Error Handling

### Call Retry Logic

Failed calls are retried up to 3 times:

```typescript
// Retryable failures
- 'busy' - Phone line was busy
- 'no-answer' - No one picked up
- 'voicemail' - Went to voicemail

// Non-retryable failures
- 'invalid-phone-number'
- 'rejected'
- 'error'
```

### Video Render Failures

- Lambda timeout: 240 seconds max
- On failure: Status set to 'failed', logged to call_events
- Manual retry available via API

### Webhook Idempotency

All webhooks check for duplicate processing:
- Stripe: Check if call already marked as paid
- ElevenLabs: Check if transcript/audio already processed
- Remotion: Check if video already uploaded

## Performance Considerations

### Cron Job Timing

- **Schedule calls**: Every 1 minute (ensures timely call initiation)
- **Send reminders**: Every 5 minutes (less time-critical)

### Video Rendering

- Lambda function: 2GB memory, 240s timeout
- Typical render time: 30-60 seconds
- Offloaded to Lambda to avoid blocking API routes

### Database Queries

- Indexed columns: `call_status`, `payment_status`, `scheduled_at`, `affiliate_id`
- Call events table for audit trail (append-only)
- Pricing config cached per request
