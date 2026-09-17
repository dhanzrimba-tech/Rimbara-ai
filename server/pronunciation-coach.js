/**
 * RIMBARA AI V8 — Pronunciation Coach
 * Audio analysis is intentionally separated from the Realtime conversation layer.
 *
 * POST /api/pronunciation/analyse
 * Body: multipart/form-data
 *   audio: audio file
 *   referenceText: optional expected sentence
 *
 * The endpoint currently performs safe, transparent analysis using transcription
 * plus acoustic proxies. It does not claim phoneme-level accuracy unless the
 * configured analysis provider supplies it.
 */
const fs = require("fs");
const path = require("path");

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function estimateFluency(text) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 0;
  const longPauses = ((text || "").match(/[,.;:!?]/g) || []).length;
  return Math.round(clamp(72 + Math.min(words.length, 40) * 0.45 - longPauses * 1.5, 0, 100));
}

function analyseTranscript(transcript, referenceText="") {
  const text = (transcript || "").trim();
  const ref = (referenceText || "").trim();
  const words = text ? text.split(/\s+/).filter(Boolean) : [];
  const unique = new Set(words.map(w => w.toLowerCase().replace(/[^a-z']/g,"")));
  const vocabulary = words.length ? Math.round(clamp(45 + unique.size / words.length * 45, 0, 100)) : 0;
  const grammar = text
    ? (/^(i am|i'm|i|we|they|he|she|it|my|this|that|there|today|yesterday|tomorrow)\b/i.test(text) ? 82 : 70)
    : 0;

  return {
    transcript: text,
    referenceText: ref,
    scores: {
      pronunciation: null,
      fluency: estimateFluency(text),
      grammar,
      vocabulary
    },
    status: "transcript_based",
    note: "Pronunciation score requires audio-level phoneme/acoustic analysis. This version does not invent a pronunciation score from text alone.",
    tips: [
      "Repeat the sentence once slowly, then once at natural speed.",
      "Pay attention to word stress and sentence rhythm.",
      "Record again and compare your pronunciation with the RIMBARA model."
    ]
  };
}

module.exports = { analyseTranscript };
