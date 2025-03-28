export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
  },
  auth: {
    // If API_KEY is set in env, use it; otherwise consider auth disabled
    enabled: !!process.env.API_KEY,
    apiKey: process.env.API_KEY || '',
  }
}; 