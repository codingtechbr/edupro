// ============================================================
//  EDUPRO — API HANDLER: /api/claude
//  Arquivo: /api/claude.js  (pasta "api" na raiz do projeto)
//  Deploy: Vercel (Serverless Function) — usando Groq (grátis)
// ============================================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Chave GROQ_API_KEY não configurada nas variáveis de ambiente da Vercel.'
    });
  }

  try {
    const { max_tokens, messages, system } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Campo "messages" é obrigatório e deve ser um array.' });
    }

    // Groq usa formato OpenAI: system vira uma mensagem no início
    const groqMessages = [
      {
        role: 'system',
        content: system || 'Você é um assistente pedagógico especialista em educação brasileira. Responda sempre em português do Brasil de forma prática e objetiva.'
      },
      ...messages
    ];

    const groqBody = {
      model:      'llama-3.3-70b-versatile',
      max_tokens: max_tokens || 1500,
      messages:   groqMessages
    };

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(groqBody)
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = data?.error?.message || JSON.stringify(data);
      return res.status(response.status).json({ error: msg });
    }

    // Converte resposta Groq para o mesmo formato que o app.js já espera da Anthropic
    return res.status(200).json({
      content: [{ text: data.choices?.[0]?.message?.content || 'Sem resposta.' }]
    });

  } catch (err) {
    console.error('Erro interno em /api/claude:', err);
    return res.status(500).json({ error: 'Erro interno do servidor: ' + err.message });
  }
}
