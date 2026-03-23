export default async function handler(req, res) {
  return res.json({
    keyExiste: !!process.env.ANTHROPIC_KEY,
    keyInicio: process.env.ANTHROPIC_KEY?.slice(0,10)
  });
}
