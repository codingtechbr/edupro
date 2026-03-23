export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(req.body)
    });

    const text = await response.text(); // 👈 lê uma vez só

    if (!response.ok) {
      console.log("ERRO ANTHROPIC:", text);
      return res.status(response.status).send(text);
    }

    return res.status(200).send(text);

  } catch (error) {
    console.error("ERRO SERVIDOR:", error);
    return res.status(500).json({ error: error.message });
  }
}
