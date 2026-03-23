export default async function handler(req, res) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  console.log("API KEY NO BACKEND:", apiKey);
