const ALLOWED = [
  'https://pavelcrypto70.github.io',
  'https://stroikavg.io',
  'http://127.0.0.1:8770',
  'http://localhost:8770',
  'http://127.0.0.1:8780',
  'http://localhost:8780'
];

function cors(origin) {
  const ok = !origin || ALLOWED.includes(origin) || origin.includes('github.io') || origin.includes('localhost') || origin.includes('127.0.0.1');
  return {
    'Access-Control-Allow-Origin': ok && origin ? origin : '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function buildText(data) {
  return [
    '📋 Новая заявка — AcademiaStroy',
    '',
    'Имя: ' + (data.name || '—'),
    'Телефон: ' + (data.phone || '—'),
    'Услуга: ' + (data.service || '—'),
    data.source ? 'Форма: ' + data.source : ''
  ].filter(Boolean).join('\n');
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '';

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', cors(origin)['Access-Control-Allow-Origin']);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  Object.entries(cors(origin)).forEach(function ([k, v]) { res.setHeader(k, v); });

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const token = process.env.TG_BOT_TOKEN;
  const chatId = process.env.TG_CHAT_ID;

  if (!token || !chatId) {
    return res.status(500).json({ ok: false, error: 'Server not configured' });
  }

  const data = req.body || {};
  const text = buildText(data);

  try {
    const tgRes = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: text })
    });

    const tgBody = await tgRes.json();

    if (!tgRes.ok || !tgBody.ok) {
      return res.status(502).json({ ok: false, error: tgBody.description || 'Telegram error' });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ ok: false, error: 'Network error' });
  }
};
