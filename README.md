# AI Receptionist MVP

A full-stack web application that acts as an AI-powered phone receptionist for small businesses. The system answers calls, handles conversations, extracts information, books appointments, summarizes calls, and sends instant notifications to business owners.

## 🎯 Core Features (MVP)

1. **Call Answering Agent** - AI-powered voice assistant that answers calls naturally
2. **Missed Call Summary** - Automatic summaries of missed calls with extracted information
3. **Business Setup Wizard** - Easy onboarding for non-technical business owners
4. **Call History Dashboard** - View and manage all calls with transcripts and summaries

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** (App Router) with TypeScript
- **Tailwind CSS** for styling
- **Shadcn/UI** components
- **React Hook Form** for forms
- **Zustand** for state management
- **Lucide React** for icons
- **Clerk** for authentication

### Backend
- **Node.js** with **Express.js** (TypeScript)
- **Prisma ORM** with **PostgreSQL**
- **BullMQ** (Redis) for async task queues
- **AWS S3** for call recordings

### Integrations
- **Vapi.ai** - Voice AI platform (handles inbound/outbound calls, ASR, LLM, TTS)
- **Twilio** - SMS notifications (optional, can also use Vapi integrations)
- **OpenAI GPT-4o-mini** - LLM for conversation & extraction (via Vapi)
- **Deepgram** - Speech-to-Text (via Vapi, or direct integration)
- **ElevenLabs** - Text-to-Speech (via Vapi, or direct integration)
- **WhatsApp Business API** - Notifications

### Deployment
- **GitHub Actions** for CI/CD
- **Minimal Machines** for AWS EC2 deployment
- **Docker** for containerization

## 📁 Project Structure

```
ai-receptionist-mvp/
├── apps/
│   ├── frontend/          # Next.js application
│   │   ├── src/
│   │   │   ├── app/       # App Router pages
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   └── hooks/
│   │   └── next.config.js
│   └── backend/           # Express server
│       ├── src/
│       │   ├── routes/
│       │   ├── services/
│       │   ├── middleware/
│       │   └── index.ts
│       └── prisma/
│           └── schema.prisma
├── packages/
│   └── shared/            # Shared types & utilities
└── .github/workflows/     # CI/CD pipelines
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose (for local DB/Redis)
- PostgreSQL (or use Supabase)
- Redis (or use Docker Compose)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ai-receptionist-mvp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example env file (create .env in root and apps/backend)
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

4. **Start local services (PostgreSQL & Redis)**
   ```bash
   npm run docker:up
   ```

5. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run migrations
   npm run db:migrate
   ```

6. **Start development servers**
   ```bash
   # Start both frontend and backend
   npm run dev
   ```

   Or run them separately:
   ```bash
   # Terminal 1: Frontend (runs on http://localhost:3000)
   cd apps/frontend && npm run dev
   
   # Terminal 2: Backend (runs on http://localhost:3001)
   cd apps/backend && npm run dev
   ```

## 📝 Environment Variables

Create `.env` files in the root and `apps/backend/` directories. See `env.example` (root) and `apps/backend/env.example` for all required variables. Also see `ENV_SETUP.md` for detailed setup instructions.

### Required Variables

- **Database**: `DATABASE_URL`, `DIRECT_URL`
- **Redis**: `REDIS_URL`
- **Clerk**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- **Vapi.ai**: `VAPI_API_KEY`, `VAPI_API_URL` (optional, defaults to https://api.vapi.ai)
- **Twilio** (for SMS only): `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- **OpenAI** (optional if using Vapi's BYOK): `OPENAI_API_KEY`
- **Deepgram** (optional if using Vapi's BYOK): `DEEPGRAM_API_KEY`
- **ElevenLabs** (optional if using Vapi's BYOK): `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`
- **AWS S3**: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME`
- **WhatsApp**: `WHATSAPP_BUSINESS_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCESS_TOKEN`

## 🔧 Development

### Database Management

```bash
# Generate Prisma client after schema changes
npm run db:generate

# Create a new migration
cd apps/backend && npx prisma migrate dev --name migration_name

# Open Prisma Studio (database GUI)
npm run db:studio
```

### Project Scripts

- `npm run dev` - Start all apps in development mode
- `npm run build` - Build all apps for production
- `npm run lint` - Lint all apps
- `npm run test` - Run tests (when implemented)
- `npm run docker:up` - Start PostgreSQL and Redis
- `npm run docker:down` - Stop PostgreSQL and Redis

## 🏗️ Architecture

### Call Flow

1. **Incoming Call** → Vapi.ai receives call and routes to configured assistant
2. **Vapi Processing** → Vapi handles ASR (Deepgram), LLM (OpenAI), and TTS (ElevenLabs) automatically
3. **Webhook Events** → Vapi sends webhooks to backend for call events (start, end, function-calls, transcripts)
4. **Backend Processing** → Backend stores call data, extracts info, books appointments
5. **Call End** → Summary generated, notifications sent, data stored

### Data Flow

- **Call Data** → Stored in PostgreSQL via Prisma
- **Recordings** → Uploaded to AWS S3
- **Async Tasks** → Processed via BullMQ (Redis) queues
- **Notifications** → Sent via Twilio SMS or WhatsApp Business API

## 🔐 Security

- API keys stored in environment variables (never commit `.env`)
- Clerk handles authentication and user management
- PII (phone numbers, transcripts) encrypted at rest
- HTTPS required for production
- Webhook signature verification for Twilio

## 🚢 Deployment

### CI/CD Pipeline

The project uses GitHub Actions for CI/CD:

- **CI** (`.github/workflows/ci.yml`): Runs on PRs - lint, type-check, build
- **Deploy** (`.github/workflows/deploy.yml`): Deploys to Minimal Machines on merge to `main` (prod) or `staging`

### Deployment Steps

1. Push to `staging` branch → Auto-deploys to staging environment
2. Push to `main` branch → Auto-deploys to production environment
3. Configure Minimal Machines with your AWS EC2 instance
4. Set environment variables in deployment environment

## 📚 API Documentation

### Webhooks

- `POST /webhooks/twilio/voice` - Handle incoming Twilio calls
- `POST /webhooks/twilio/status` - Handle call status updates

### API Endpoints

- `GET /api/businesses` - Get business details (auth required)
- `POST /api/businesses` - Create/update business (auth required)
- `GET /api/calls` - Get call history (auth required)
- `GET /api/calls/:callId` - Get call details (auth required)
- `POST /api/vapi/assistants` - Create Vapi assistant (auth required)
- `POST /api/vapi/calls` - Create outbound call (auth required)
- `GET /api/vapi/calls/:callId` - Get call details from Vapi (auth required)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Ensure linting and tests pass
4. Submit a pull request

## 📄 License

[Add your license here]

## 🆘 Support

For issues and questions, please open an issue in the repository.

---

**Note**: This is an MVP. Additional features and improvements will be added iteratively.

