module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const sheetsUrl = process.env.SHEETS_URL;

  if (!sheetsUrl) {
    return res.status(500).json({ error: 'SHEETS_URL not configured' });
  }

  try {
    await fetch(sheetsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    return res.status(200).json({ status: 'ok' });

  } catch (err) {
    console.error('Erro ao enviar para planilha:', err);
    return res.status(500).json({ error: 'Sheets error' });
  }
}
