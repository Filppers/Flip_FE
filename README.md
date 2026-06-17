# Flip FE

Next.js 14 frontend for **Flip**, an AI-powered travel planning service. Users sign in with Google OAuth, complete a preference funnel, and receive generated trip plans via OpenAI.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ (project uses `@types/node` ^20)
- npm (or yarn / pnpm / bun)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment sample and fill in your values:

```bash
cp .env.sample .env
```

3. Configure the variables described in [Environment variables](#environment-variables) below.

## Environment variables

Create a `.env` file in the project root (`.env` is gitignored). See `.env.sample` for placeholders.

| Variable | Required | Scope | Description |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Yes (Google login) | Client + server | Google OAuth 2.0 client ID. Used in the login URL (`src/constants.ts`) and token exchange (`src/pages/api/oauth/callback.ts`). |
| `NEXT_PUBLIC_REDIRECT_URI` | No | Client + server | OAuth redirect URI. Defaults to `http://localhost:3000/oauth/callback/google` when unset. Must match the URI registered in Google Cloud Console. |
| `GOOGLE_CLIENT_SECRET` | Yes (Google login) | Server only | Google OAuth client secret for exchanging auth codes in `/api/oauth/callback`. |
| `OPENAI_API_KEY` | Yes (trip planning) | Server only | OpenAI API key used by `/api/chat` to generate travel plans (model: `gpt-4o`). |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | No | Client | Google Maps JavaScript API key for `TripRouteMap`. Optional; defaults to an empty string if unset. |

### Backend API (hardcoded)

`src/api/config.tsx` defines an axios instance with `baseURL: "http://localhost:8080"`, but it is not imported elsewhere in the codebase yet. No environment variable controls this URL today.

## Scripts

Defined in `package.json`:

| Script | Command | Description |
| --- | --- | --- |
| `dev` | `next dev` | Start the development server with hot reload (default port 3000). |
| `build` | `next build` | Create an optimized production build. |
| `start` | `next start` | Serve the production build (run `build` first). |
| `lint` | `next lint` | Run ESLint via Next.js. |

There are no `test` scripts, Docker files, or shell run scripts in this repository.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Main routes:

- `/` — landing page with Google login
- `/login` — login page
- `/oauth/callback/[provider]` — OAuth callback (e.g. `/oauth/callback/google`)
- `/trip/plan` — travel preference funnel and AI-generated plan

### Production build

```bash
npm run build
npm run start
```

## API routes

Next.js API routes under `src/pages/api/`:

| Route | Method | Env vars | Purpose |
| --- | --- | --- | --- |
| `/api/oauth/callback` | GET | `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_REDIRECT_URI` | Exchange Google auth code for user profile (name, email, picture). |
| `/api/chat` | POST | `OPENAI_API_KEY` | Generate travel plan JSON from user prompts (`step`: `summary`, `details`, or default). |

## Tech stack

- **Framework:** Next.js 14.2 (Pages Router, `src/pages/`)
- **UI:** React 18, Tailwind CSS
- **Data:** TanStack React Query, axios
- **Integrations:** Google OAuth, OpenAI, Google Maps (`@react-google-maps/api`)

## Project structure

```
src/
├── pages/          # Routes and API handlers
├── components/     # UI components
├── constant/       # OpenAI prompt templates
├── api/            # Axios config (backend base URL)
├── constants.ts    # Funnel options, Google login URL
└── styles/         # Global CSS
```
