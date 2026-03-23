const data = await response.json();

if (!response.ok) {
  console.log("ERRO ANTHROPIC:", data);
  return res.status(response.status).json(data);
}
