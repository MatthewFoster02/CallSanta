# Environment Variables

This document lists all environment variables required to run CallSanta.

## Quick Start

Create a `.env.local` file in the project root with the following variables. Variables marked with `*` are required for basic functionality.

## Supabase (Database & Storage)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | * | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | * | Supabase anonymous/public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | * | Supabase service role key (server-side only) |

**Where to find:**
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the Project URL and both keys

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Stripe (Payment Processing)

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | * | Stripe secret API key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | * | Stripe publishable key (client-side) |
| `STRIPE_WEBHOOK_SECRET` | * | Webhook signing secret |
| `STRIPE_CALL_PRICE_ID` | * | Price ID for base Santa call |
| `STRIPE_RECORDING_PRICE_ID` | * | Price ID for recording add-on |

**Where to find:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. API keys: Developers > API Keys
3. Webhook secret: Developers > Webhooks > Select endpoint > Signing secret
4. Price IDs: Products > Select product > Price ID

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CALL_PRICE_ID=price_...
STRIPE_RECORDING_PRICE_ID=price_...
```

**Note:** Use `sk_test_` and `pk_test_` keys for development. Switch to live keys for production.

---

## Twilio (Phone Infrastructure)

| Variable | Required | Description |
|----------|----------|-------------|
| `TWILIO_ACCOUNT_SID` | * | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | * | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | * | Twilio phone number for outbound calls |
| `TWILIO_RECOVERY_CODE` | | Backup recovery code |

**Where to find:**
1. Go to [Twilio Console](https://console.twilio.com)
2. Account SID and Auth Token on the main dashboard
3. Phone Number: Phone Numbers > Manage > Active Numbers

```env
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+19525551234
TWILIO_RECOVERY_CODE=...
```

---

## ElevenLabs (AI Voice Conversations)

| Variable | Required | Description |
|----------|----------|-------------|
| `ELEVENLABS_API_KEY` | * | ElevenLabs API key |
| `ELEVENLABS_AGENT_ID` | * | Conversational AI agent ID |
| `ELEVENLABS_AGENT_PHONE_NUMBER_ID` | * | Phone number ID linked to agent |
| `ELEVENLABS_WEBHOOK_SECRET` | * | Webhook signing secret |

**Where to find:**
1. Go to [ElevenLabs Dashboard](https://elevenlabs.io)
2. API key: Profile > API Keys
3. Agent ID: Conversational AI > Select agent > Agent ID
4. Phone Number ID: Conversational AI > Phone Numbers
5. Webhook Secret: Conversational AI > Webhooks settings

```env
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_AGENT_ID=agent_...
ELEVENLABS_AGENT_PHONE_NUMBER_ID=phnum_...
ELEVENLABS_WEBHOOK_SECRET=wsec_...
```

---

## Resend (Email Service)

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | * | Resend API key |
| `EMAIL_FROM` | * | Sender email address and name |

**Where to find:**
1. Go to [Resend Dashboard](https://resend.com)
2. API Keys: Settings > API Keys

```env
RESEND_API_KEY=re_...
EMAIL_FROM="Santa <santa@yourdomain.com>"
```

**Note:** You must verify your domain in Resend before sending from it.

---

## AWS Lambda (Video Rendering)

These are required for video generation via Remotion Lambda.

| Variable | Required | Description |
|----------|----------|-------------|
| `REMOTION_AWS_ACCESS_KEY_ID` | | AWS access key ID |
| `REMOTION_AWS_SECRET_ACCESS_KEY` | | AWS secret access key |
| `REMOTION_AWS_REGION` | | AWS region (e.g., `us-east-1`) |
| `REMOTION_FUNCTION_NAME` | | Lambda function name |
| `REMOTION_SERVE_URL` | | Remotion bundle URL in S3 |
| `REMOTION_WEBHOOK_SECRET` | | Webhook signing secret |

**Setup:**
1. Follow [Remotion Lambda setup guide](https://www.remotion.dev/docs/lambda/setup)
2. Deploy the Lambda function using `npx remotion lambda functions deploy`
3. Deploy the site bundle using `npx remotion lambda sites create`

```env
REMOTION_AWS_ACCESS_KEY_ID=AKIA...
REMOTION_AWS_SECRET_ACCESS_KEY=...
REMOTION_AWS_REGION=us-east-1
REMOTION_FUNCTION_NAME=remotion-render-4-0-379-mem2048mb-disk2048mb-240sec
REMOTION_SERVE_URL=https://remotionlambda-useast1-xxx.s3.us-east-1.amazonaws.com/sites/callsanta/index.html
REMOTION_WEBHOOK_SECRET=wbhk_sec_...
```

---

## Application Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | * | Base URL of the application |
| `CRON_SECRET` | * | Secret for authenticating cron job requests |
| `ADMIN_API_KEY` | | Optional API key for admin endpoints |

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=your-secure-random-string
ADMIN_API_KEY=your-admin-api-key
```

**Production:** Set `NEXT_PUBLIC_APP_URL` to your production domain (e.g., `https://santasnumber.com`)

---

## Discord Notifications

Optional webhooks for business notifications.

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_SOMEONE_PAID_CHANNEL` | | Webhook URL for payment notifications |
| `DISCORD_AFFILIATE_JOINED_CHANNEL` | | Webhook URL for affiliate signups |

**Setup:**
1. In Discord, go to Server Settings > Integrations > Webhooks
2. Create a webhook for each channel
3. Copy the webhook URL

```env
DISCORD_SOMEONE_PAID_CHANNEL=https://discord.com/api/webhooks/xxx/yyy
DISCORD_AFFILIATE_JOINED_CHANNEL=https://discord.com/api/webhooks/xxx/zzz
```

---

## Analytics & Marketing

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_META_PIXEL_ID` | | Meta (Facebook) Pixel ID for conversion tracking |

**Where to find:**
1. Go to [Meta Events Manager](https://business.facebook.com/events_manager)
2. Select your Pixel
3. Copy the Pixel ID

```env
NEXT_PUBLIC_META_PIXEL_ID=1234567890123456
```

---

## Complete Example

Here's a complete `.env.local` template:

```env
# ===========================================
# Supabase
# ===========================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ===========================================
# Stripe
# ===========================================
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CALL_PRICE_ID=price_...
STRIPE_RECORDING_PRICE_ID=price_...

# ===========================================
# Twilio
# ===========================================
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+19525551234

# ===========================================
# ElevenLabs
# ===========================================
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_AGENT_ID=agent_...
ELEVENLABS_AGENT_PHONE_NUMBER_ID=phnum_...
ELEVENLABS_WEBHOOK_SECRET=wsec_...

# ===========================================
# Resend (Email)
# ===========================================
RESEND_API_KEY=re_...
EMAIL_FROM="Santa <santa@yourdomain.com>"

# ===========================================
# AWS Lambda (Video Rendering) - Optional
# ===========================================
REMOTION_AWS_ACCESS_KEY_ID=AKIA...
REMOTION_AWS_SECRET_ACCESS_KEY=...
REMOTION_AWS_REGION=us-east-1
REMOTION_FUNCTION_NAME=remotion-render-4-0-379-mem2048mb-disk2048mb-240sec
REMOTION_SERVE_URL=https://remotionlambda-useast1-xxx.s3.amazonaws.com/sites/callsanta/index.html
REMOTION_WEBHOOK_SECRET=wbhk_sec_...

# ===========================================
# Application
# ===========================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=your-secure-random-string
ADMIN_API_KEY=your-admin-api-key

# ===========================================
# Discord Notifications - Optional
# ===========================================
DISCORD_SOMEONE_PAID_CHANNEL=https://discord.com/api/webhooks/xxx/yyy
DISCORD_AFFILIATE_JOINED_CHANNEL=https://discord.com/api/webhooks/xxx/zzz

# ===========================================
# Analytics - Optional
# ===========================================
NEXT_PUBLIC_META_PIXEL_ID=1234567890123456
```

---

## Security Notes

- **Never commit `.env.local` to version control** - it's already in `.gitignore`
- Use test/sandbox keys for development, live keys for production
- Rotate secrets if they're ever exposed
- Use Vercel Environment Variables for production deployments
- Service role keys (`SUPABASE_SERVICE_ROLE_KEY`) bypass Row Level Security - use carefully

## Vercel Deployment

When deploying to Vercel:

1. Go to Project Settings > Environment Variables
2. Add each variable
3. Set the appropriate environment (Production, Preview, Development)
4. Redeploy for changes to take effect

Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. All others are server-only.
