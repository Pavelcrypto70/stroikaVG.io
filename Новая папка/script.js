/**
 * Настройка Telegram-бота для заявок с сайта.
 *
 * 1. Напишите @BotFather → /newbot → скопируйте токен в BOT_TOKEN
 * 2. Узнайте CHAT_ID: напишите боту любое сообщение, откройте в браузере:
 *    https://api.telegram.org/bot<ВАШ_ТОКЕН>/getUpdates
 *    В ответе найдите "chat":{"id":123456789} — это CHAT_ID
 */
const TELEGRAM = {
  BOT_TOKEN: '',
  CHAT_ID: ''
};

document.addEventListener('DOMContentLoaded', function () {
  const modal = document.getElementById('callbackModal');
  const openBtns = document.querySelectorAll('.callback-open');
  const closeBtn = document.querySelector('.close-modal');
  const serviceSelect = document.getElementById('modal-service');
  let scrollTopBeforeModal = 0;

  openBtns.forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      const serviceVal = btn.getAttribute('data-service');
      if (serviceVal && serviceSelect){
        const options = Array.from(serviceSelect.options);
        const match = options.find(o => o.value === serviceVal || o.text.includes(serviceVal));
        if (match) serviceSelect.value = match.value;
      }
      if (modal){
        scrollTopBeforeModal = window.pageYOffset || document.documentElement.scrollTop || 0;
        modal.style.display = 'flex';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollTopBeforeModal}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
      }
    });
  });

  function closeModal(){
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollTopBeforeModal);
  }

  if (closeBtn && modal){
    closeBtn.onclick = closeModal;
  }

  window.addEventListener('click', function(e){
    if (e.target === modal){
      closeModal();
    }
  });

  function isTelegramConfigured(){
    return Boolean(TELEGRAM.BOT_TOKEN && TELEGRAM.CHAT_ID);
  }

  async function sendToTelegram(data){
    if (!isTelegramConfigured()){
      return false;
    }

    const lines = [
      '📋 Новая заявка с сайта AcademiaStroy',
      '',
      `Имя: ${data.name || '—'}`,
      `Телефон: ${data.phone || '—'}`,
      `Услуга: ${data.service || '—'}`
    ];

    if (data.email){
      lines.push(`Email: ${data.email}`);
    }
    if (data.source){
      lines.push(`Форма: ${data.source}`);
    }

    const url = `https://api.telegram.org/bot${TELEGRAM.BOT_TOKEN}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM.CHAT_ID,
        text: lines.join('\n')
      })
    });

    if (!response.ok){
      throw new Error('Telegram API error');
    }

    return true;
  }

  function setFormLoading(form, loading){
    const submitBtn = form.querySelector('[type="submit"]');
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    if (loading){
      submitBtn.dataset.originalText = submitBtn.textContent;
      submitBtn.textContent = 'Отправка…';
    } else if (submitBtn.dataset.originalText){
      submitBtn.textContent = submitBtn.dataset.originalText;
    }
  }

  async function submitLead(form, payload, successMessage){
    setFormLoading(form, true);

    try {
      if (isTelegramConfigured()){
        await sendToTelegram(payload);
      } else {
        console.info('Telegram не настроен — заявка сохранена только локально. Заполните TELEGRAM в script.js');
      }
      alert(successMessage);
      form.reset();
      if (modal && modal.style.display === 'flex') closeModal();
    } catch (err){
      console.error(err);
      alert('Не удалось отправить заявку. Попробуйте позже или свяжитесь с нами по телефону.');
    } finally {
      setFormLoading(form, false);
    }
  }

  function handleFormSubmit(formId, getPayload, successMessage){
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', function(e){
      e.preventDefault();
      submitLead(form, getPayload(form), successMessage);
    });
  }

  handleFormSubmit('main-form', function(form){
    return {
      name: document.getElementById('form-name')?.value.trim(),
      phone: document.getElementById('form-phone')?.value.trim(),
      service: document.getElementById('form-service')?.value,
      source: 'Контакты'
    };
  }, 'Спасибо! Заявка отправлена.');

  handleFormSubmit('modal-form', function(form){
    return {
      name: document.getElementById('modal-name')?.value.trim(),
      phone: document.getElementById('modal-phone')?.value.trim(),
      service: document.getElementById('modal-service')?.value,
      source: 'Модальное окно'
    };
  }, 'Спасибо! Заявка отправлена.');

  const checklistForm = document.getElementById('checklist-form');
  if (checklistForm){
    checklistForm.addEventListener('submit', function(e){
      e.preventDefault();
      submitLead(checklistForm, {
        name: document.getElementById('cl-name')?.value.trim(),
        phone: document.getElementById('cl-phone')?.value.trim(),
        email: document.getElementById('cl-email')?.value.trim(),
        service: 'Чек-лист PDF',
        source: 'Чек-лист'
      }, 'PDF отправлен на email.');
    });
  }

  document.querySelectorAll('a.nav-link[href^="#"]').forEach(function(link){
    link.addEventListener('click', function(e){
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const header = document.querySelector('header');
      const offset = (header ? header.getBoundingClientRect().height : 0) + 12;
      const y = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });
});
