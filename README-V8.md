# RIMBARA AI V8 — Pronunciation Coach

V8 builds on V7.1 and adds a dedicated pronunciation-coaching layer.

## Learning loop
Listen → Understand → Repeat → Speak → Feedback → Improve

## Important accuracy rule
V8 does **not** fabricate a phoneme-level pronunciation score from a transcript.
The pronunciation field is `null` until a genuine audio/phoneme analysis provider is connected.

The current module can analyse:
- transcript
- fluency proxy
- grammar proxy
- vocabulary proxy
- personalised practice tips

## Next production integration
Connect a real audio pronunciation/phoneme assessment service or an internally validated audio-analysis pipeline. Keep the scoring transparent and separate from the Realtime conversation model.

## Run
Use the same server setup as V7.1. See RUN-V7.md / README-V7.md included in the project.
