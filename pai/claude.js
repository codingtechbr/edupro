// ============================================================
//  EDUPRO — API HANDLER: /api/claude
//  Arquivo: /api/claude.js  (pasta "api" na raiz do projeto)
//  Deploy: Vercel (Serverless Function)
// ============================================================

export default async function handler(req, res) {
  // Apenas POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  // Lê a chave da variável de ambiente (configurada no painel da Vercel)
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Chave ANTHROPIC_API_KEY não configurada nas variáveis de ambiente da Vercel.'
    });
  }

  try {
    const { model, max_tokens, messages, system } = req.body;

    // Valida campos obrigatórios
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Campo "messages" é obrigatório e deve ser um array.' });
    }

    // Monta o body para a API da Anthropic
    const anthropicBody = {
      model:      model      || 'claude-haiku-4-5-20251001', // modelo atual e válido
      max_tokens: max_tokens || 1500,
      messages,
      ...(system ? { system } : {})
    };

    // Chama a API da Anthropic
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':         'application/json',
        'x-api-key':            apiKey,
        'anthropic-version':    '2023-06-01'
      },
      body: JSON.stringify(anthropicBody)
    });

    const data = await response.json();

    // Repassa erros da Anthropic com clareza
    if (!response.ok) {
      const msg = data?.error?.message || JSON.stringify(data);
      return res.status(response.status).json({ error: msg });
    }

    // Retorna a resposta completa ao frontend
    return res.status(200).json(data);

  } catch (err) {
    console.error('Erro interno em /api/claude:', err);
    return res.status(500).json({ error: 'Erro interno do servidor: ' + err.message });
  }
}
