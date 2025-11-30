# CallSanta

A web application that lets parents book personalized phone calls from Santa Claus to their children, powered by AI voice technology.

## Features

- **Personalized Santa Calls** - AI-powered conversations using child's name, age, and interests
- **Flexible Scheduling** - Book calls in advance or request immediate calls
- **Call Recording** - Optional recording with shareable video generation
- **Affiliate Program** - Built-in referral system with tracking
- **Email Notifications** - Confirmations, reminders, and post-call summaries

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Database | Supabase (PostgreSQL) |
| Payments | Stripe |
| AI Voice | ElevenLabs + Twilio |
| Video | Remotion + AWS Lambda |
| Email | Resend |
| Hosting | Vercel |

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
src/
├── app/                 # Next.js pages & API routes
│   ├── api/            # Backend endpoints
│   │   ├── calls/      # Call management
│   │   ├── webhooks/   # Stripe, ElevenLabs, Remotion
│   │   └── cron/       # Scheduled jobs
│   ├── book/           # Booking wizard
│   └── recording/      # Video playback
├── components/         # React components
├── lib/               # Services & utilities
└── remotion/          # Video composition
```

## Scripts

```bash
npm run dev              # Development server
npm run build            # Production build
npm run remotion:studio  # Video composition editor
npm run worker:dev       # Background worker
```

## Documentation

See the [docs/](./docs/) folder for detailed documentation:

- [Getting Started](./docs/GETTING_STARTED.md) - Local setup guide
- [Architecture](./docs/ARCHITECTURE.md) - System design & data flow
- [API Reference](./docs/API_REFERENCE.md) - Endpoint documentation
- [Environment Variables](./docs/ENVIRONMENT_VARIABLES.md) - Configuration
- [Database Schema](./docs/DATABASE_SCHEMA.md) - Tables & storage

## How It Works

1. Parent fills out booking form with child details
2. Payment processed via Stripe
3. At scheduled time, cron job triggers ElevenLabs
4. Santa AI calls the phone number and has a personalized conversation
5. If recording purchased, audio is rendered into shareable video
6. Email sent with transcript and/or video link

## License

Private - All rights reserved.
