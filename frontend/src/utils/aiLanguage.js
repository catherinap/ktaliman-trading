export function buildAIPrompt({ aiLanguage, context }) {
  const langInstruction =
    aiLanguage === "uk"
      ? "Respond in Ukrainian. Use natural financial terminology."
      : "Respond in English. Use natural financial terminology.";

  return `${langInstruction}\n\nContext:\n${context}`;
}