# Getting Started

This guide walks you through setting up CallSanta for local development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or later
- **npm** 9.x or later (comes with Node.js)
- **Git** for version control

You'll also need accounts and API keys for the following services:

| Service | Purpose | Sign Up |
|---------|---------|---------|
| Supabase | Database & file storage | [supabase.com](https://supabase.com) |
| Stripe | Payment processing | [stripe.com](https://stripe.com) |
| ElevenLabs | AI voice conversations | [elevenlabs.io](https://elevenlabs.io) |
| Twilio | Phone infrastructure | [twilio.com](https://twilio.com) |
| Resend | Email delivery | [resend.com](https://resend.com) |
| AWS | Lambda for video rendering (optional) | [aws.amazon.com](https://aws.amazon.com) |

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd callsanta-web
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your API keys. See [Environment Variables](./ENVIRONMENT_VARIABLES.md) for the complete list.

**Minimum required for basic functionality:**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_CALL_PRICE_ID=price_...
STRIPE_RECORDING_PRICE_ID=price_...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Set Up Supabase Database

1. Create a new Supabase project
2. Run the database migrations from `supabase/migrations/` (or apply the schema manually)
3. Create the required storage buckets:
   - `voice-recordings` - For parent voice messages
   - `call-recordings` - For call audio files
   - `call-videos` - For generated video files

### 5. Configure Stripe Products

In your Stripe Dashboard:

1. Create a product for "Santa Call"
2. Create a price for the base call (e.g., $4.99)
3. Create a price for the recording add-on (e.g., $2.99)
4. Copy the price IDs to your `.env.local`

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Workflow

### Running the App

```bash
npm run dev
```

The app runs on `http://localhost:3000` with hot reload enabled.

### Working with Video (Remotion)

Preview video compositions:

```bash
npm run remotion:preview
```

Open the Remotion Studio for interactive editing:

```bash
npm run remotion:studio
```

Render a test video locally:

```bash
npm run remotion:render
```

### Running the Background Worker

For processing video renders locally:

```bash
npm run worker:dev
```

### Linting

```bash
npm run lint
```

## Testing Webhooks Locally

For local development, you'll need to expose your local server to receive webhooks from Stripe and ElevenLabs.

### Using ngrok

1. Install ngrok: `brew install ngrok` (macOS) or download from [ngrok.com](https://ngrok.com)

2. Start your local server:
   ```bash
   npm run dev
   ```

3. In another terminal, expose port 3000:
   ```bash
   ngrok http 3000
   ```

4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

5. Configure webhooks in your service dashboards:

   **Stripe:**
   - Go to Developers > Webhooks
   - Add endpoint: `https://abc123.ngrok.io/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`

   **ElevenLabs:**
   - Configure your agent's webhook URL: `https://abc123.ngrok.io/api/webhooks/elevenlabs`

## Stripe Testing

Use Stripe's test card numbers for development:

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 3220` | 3D Secure authentication required |
| `4000 0000 0000 9995` | Payment declined |

Use any future expiry date and any 3-digit CVC.

## Project Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run remotion:preview` | Preview Remotion composition |
| `npm run remotion:studio` | Open Remotion Studio |
| `npm run remotion:render` | Render video locally |
| `npm run remotion:test` | Run video render test script |
| `npm run video:process` | Process video rendering |
| `npm run worker:dev` | Run background worker (dev mode) |
| `npm run worker:start` | Run background worker (production) |

## Common Issues

### "Missing Supabase environment variables"

Ensure both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env.local`.

### "Stripe price ID not found"

Create products and prices in your Stripe Dashboard and copy the price IDs to `STRIPE_CALL_PRICE_ID` and `STRIPE_RECORDING_PRICE_ID`.

### "Video rendering fails locally"

Video rendering requires significant CPU/memory. Ensure you have at least 8GB RAM available. For production, use AWS Lambda via Remotion Lambda.

### "Webhooks not receiving events"

1. Verify ngrok is running and the URL is current
2. Check webhook signing secrets match your `.env.local`
3. Check the webhook logs in Stripe/ElevenLabs dashboards

## Next Steps

- Read the [Architecture](./ARCHITECTURE.md) guide to understand the system design
- Review the [API Reference](./API_REFERENCE.md) for endpoint documentation
- Check [Environment Variables](./ENVIRONMENT_VARIABLES.md) for all configuration options
