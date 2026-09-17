# RIMBARA AI V7 — Live Voice Tutor

V7 upgrades the prototype to a real browser voice-to-voice conversation using WebRTC. The permanent OpenAI API key remains server-side; the browser receives a short-lived realtime client secret.

## Run
1. Open a terminal in `server/`.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and put your OpenAI API key in `OPENAI_API_KEY`.
4. Run `npm start`.
5. Serve `rimbara_v3/` from the same origin (or configure your production reverse proxy). Do not open the HTML with `file://`.
6. Open the page over HTTPS in production and allow microphone access.

## V7 features
- Raka / Rara tutor selection
- British English tutor instructions
- Daily Conversation, Forestry English, PKL / Field Practice, Job Interview
- Slow Mode
- WebRTC realtime voice-to-voice
- Microphone level indicator
- Animated speaking/listening state
- Server-side API key protection
- Fallback REST/TTS endpoints retained from V6

## Notes
The exact available realtime model/voice capabilities can change. The model is configurable through `OPENAI_REALTIME_MODEL`.
