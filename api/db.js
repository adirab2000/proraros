const SUPABASE_URL = 'https://gvmpijgmfbwzndojyyta.supabase.co';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;
  const { acao } = req.body;

  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Prefer': 'return=minimal'
  };

  try {

    // ── Registra sessão iniciada ──
    if (acao === 'registrar_sessao') {
      const { codigo_sessao } = req.body;
      await fetch(`${SUPABASE_URL}/rest/v1/sessoes`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ codigo_sessao, status: 'iniciado' })
      });
      return res.status(200).json({ status: 'ok' });
    }

    // ── Salva mensagem individual ──
    if (acao === 'salvar_mensagem') {
      const { codigo_sessao, role, content } = req.body;
      await fetch(`${SUPABASE_URL}/rest/v1/mensagens`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ codigo_sessao, role, content })
      });
      return res.status(200).json({ status: 'ok' });
    }

    // ── Busca histórico de uma sessão (retomada) ──
    if (acao === 'buscar_sessao') {
      const { codigo_sessao } = req.body;

      // Busca sessão
      const rSessao = await fetch(
        `${SUPABASE_URL}/rest/v1/sessoes?codigo_sessao=eq.${codigo_sessao}&select=*`,
        { headers }
      );
      const sessoes = await rSessao.json();
      if (!sessoes.length) return res.status(404).json({ error: 'Sessão não encontrada' });

      // Busca mensagens ordenadas
      const rMsgs = await fetch(
        `${SUPABASE_URL}/rest/v1/mensagens?codigo_sessao=eq.${codigo_sessao}&order=created_at.asc&select=role,content`,
        { headers }
      );
      const mensagens = await rMsgs.json();

      return res.status(200).json({
        status: 'ok',
        sessao: sessoes[0],
        mensagens
      });
    }

    // ── Conclui entrevista — salva dados estruturados ──
    if (acao === 'concluir_entrevista') {
      const { codigo_sessao, ...dados } = req.body;

      // Atualiza status da sessão
      await fetch(
        `${SUPABASE_URL}/rest/v1/sessoes?codigo_sessao=eq.${codigo_sessao}`,
        {
          method: 'PATCH',
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ status: 'concluido', updated_at: new Date().toISOString() })
        }
      );

      // Salva entrevista estruturada (upsert)
      await fetch(`${SUPABASE_URL}/rest/v1/entrevistas`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({ codigo_sessao, ...dados })
      });

      return res.status(200).json({ status: 'ok' });
    }

    return res.status(400).json({ error: 'Acao desconhecida: ' + acao });

  } catch (err) {
    console.error('Erro no banco:', err);
    return res.status(500).json({ error: 'Database error' });
  }
}
