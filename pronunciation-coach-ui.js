// RIMBARA AI V8 — Pronunciation Coach UI helper
// Call window.showPronunciationResult(result) from the existing speaking-feedback UI.
window.showPronunciationResult = function(result) {
  const scores = result?.scores || {};
  const fmt = v => v == null ? "Belum dianalisis" : `${v}/100`;
  return {
    pronunciation: fmt(scores.pronunciation),
    fluency: fmt(scores.fluency),
    grammar: fmt(scores.grammar),
    vocabulary: fmt(scores.vocabulary),
    tips: result?.tips || []
  };
};
