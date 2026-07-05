/**
 * Google Apps Script — прокси заявок в Telegram
 * После изменений: Развернуть → Управление развертываниями → ✏️ → Новая версия
 */

var BOT_TOKEN = '8800158481:AAHJIFzhEoGaOJ6Osk1wVpcfoChTs67Xgjk';
var CHAT_ID = '-5504381659';

function parseRequest(e) {
  if (e.postData && e.postData.contents) {
    var type = e.postData.type || '';
    if (type.indexOf('application/json') >= 0) {
      return JSON.parse(e.postData.contents);
    }
    if (type.indexOf('application/x-www-form-urlencoded') >= 0) {
      return e.parameter || {};
    }
  }
  return e.parameter || {};
}

function buildText(data) {
  return [
    '📋 Новая заявка — AcademiaStroy',
    '',
    'Имя: ' + (data.name || '—'),
    'Телефон: ' + (data.phone || '—'),
    'Услуга: ' + (data.service || '—'),
    data.source ? 'Форма: ' + data.source : ''
  ].filter(String).join('\n');
}

function sendToTelegram(text) {
  var url = 'https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage';
  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ chat_id: CHAT_ID, text: text }),
    muteHttpExceptions: true
  });
  return JSON.parse(res.getContentText());
}

function handleLead(data) {
  var body = sendToTelegram(buildText(data));
  if (!body.ok) {
    return jsonOut({ ok: false, error: body.description || 'Telegram error' });
  }
  return jsonOut({ ok: true, sent: true });
}

function doPost(e) {
  try {
    return handleLead(parseRequest(e));
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  var p = (e && e.parameter) ? e.parameter : {};

  if (p.test === '1') {
    var body = sendToTelegram('✅ Тест: прокси AcademiaStroy работает');
    return jsonOut(body.ok ? { ok: true, sent: true, message: 'Сообщение отправлено в Telegram' } : { ok: false, error: body.description });
  }

  if (p.name || p.phone) {
    return handleLead(p);
  }

  return jsonOut({ ready: true, status: 'AcademiaStroy form proxy ready' });
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
