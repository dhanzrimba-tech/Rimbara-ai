# RIMBARA AI V8.3 — Vercel Edition

Prepared for Vercel deployment.

- Frontend is served from the repository root.
- `/api/*` uses Vercel serverless functions.
- `OPENAI_API_KEY` stays server-side.
- Realtime WebRTC SDP is created server-side through the OpenAI SDK; the browser never receives the permanent API key.
- Default text model: `gpt-5.6-luna`
- Default realtime model: `gpt-realtime-2.1`

Vercel settings:
- Application Preset: Other
- Root Directory: `./`
- Build Command: leave default/blank
- Output Directory: leave default/blank
- Add `OPENAI_API_KEY` in Environment Variables.

OpenAI's current API reference documents `POST /realtime/calls` for creating WebRTC calls and returning the SDP answer.
