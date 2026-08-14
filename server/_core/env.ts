export const ENV = {
  isProduction: process.env.NODE_ENV === "production",
  // Anthropic Claude API — get a key at https://console.anthropic.com/
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  anthropicModel: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5",
};
