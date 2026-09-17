# RIMBARA AI V7.1 — Voice Tutor + Speaking Feedback

V7.1 continues V7 with two practical learning features:
- realtime learner transcript when the Realtime session provides input transcription;
- an end-of-session AI feedback action for pronunciation (text-based estimate only), fluency, grammar and vocabulary.

## Run
1. `cd server`
2. `npm install`
3. Copy `.env.example` to `.env` and set `OPENAI_API_KEY`.
4. `npm start`
5. Serve `rimbara_v3/` from a web server. Do not open with `file://`.

## Important
The permanent API key remains server-side. The browser receives only a short-lived realtime client secret.

The feedback feature is educational guidance, not a formal language assessment. Pronunciation cannot be reliably scored from a transcript alone; V8 can add dedicated audio pronunciation analysis.
