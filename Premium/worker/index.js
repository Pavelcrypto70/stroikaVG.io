const ALLOWED_ORIGINS = [
  'https://pavelcrypto70.github.io',
  'https://stroikavg.io',
  'http://127.0.0.1:8770',
  'http://localhost:8770',
  'http://127.0.0.1:8780',
  'http://localhost:8780'
];

function corsHeaders(origin) {
  const allowed = !origin || ALLOWED_ORIGINS.some(function (o) {
    return origin === o || origin.startsWith(o.replace(/:\d+$/, ''));
  }) || origin.includes('github.io') || origin.includes('127.0.0.1') || origin.includes('localhost');

  return {
    'Access-Control-Allow-Origin': allowed && origin ? origin : '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}

function buildMessage(data) {
  return [
    '📋 Новая заявка — AcademiaStroy',
    '',
    'Имя: ' + (data.name || '—'),
    'Телефон: ' + (data.phone || '—'),
    'Услуга: ' + (data.service || '—'),
    data.source ? 'Форма: ' + data.source : ''
  ].filter(Boolean).join('\n');
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
      });
    }

    if (!env.BOT_TOKEN || !env.CHAT_ID) {
      return new Response(JSON.stringify({ ok: false, error: 'Server not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
      });
    }

    let data;
    try {
      data = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
      });
    }

    const text = buildMessage(data);
    const tgRes = await fetch('https://api.telegram.org/bot' + env.BOT_TOKEN + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.CHAT_ID,
        text: text
      })
    });

    const tgBody = await tgRes.json();

    if (!tgRes.ok || !tgBody.ok) {
      return new Response(JSON.stringify({ ok: false, error: tgBody.description || 'Telegram error' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
    });
  }
};
