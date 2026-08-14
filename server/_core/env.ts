export const ENV = {
  isProduction: process.env.NODE_ENV === "production",
  // Google Gemini API — free tier, no credit card required.
  // Get a key at https://aistudio.google.com/apikey
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
};
