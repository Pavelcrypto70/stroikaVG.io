/**
 * URL прокси (Google Apps Script). После развертывания telegram-proxy.gs:
 * const FORM_API = 'https://script.google.com/macros/s/ВАШ_ID/exec';
 */
const FORM_API = 'https://script.google.com/macros/s/AKfycby2fivlmf6OG5MR9VHW-Etbl49e9XwQEAMshjR5k2mvUsCQz9owosTOuPrSShhonEaL3w/exec';
document.addEventListener('DOMContentLoaded', function () {
  const header = document.getElementById('siteHeader');
  const modal = document.getElementById('callbackModal');
  const modalBackdrop = modal?.querySelector('.modal-backdrop');
  const closeBtn = modal?.querySelector('.close-modal');
  const serviceSelect = document.getElementById('modal-service');
  const openBtns = document.querySelectorAll('.callback-open');
  let scrollTopBeforeModal = 0;

  function onScroll() {
    if (header) {
      header.classList.toggle('scrolled', window.scrollY > 40);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(function (el) { revealObserver.observe(el); });

  document.querySelectorAll('[data-count]').forEach(function (el) {
    const counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const target = parseInt(entry.target.dataset.count, 10);
        const node = entry.target;
        const start = performance.now();
        const duration = 2000;

        function tick(now) {
          const p = Math.min((now - start) / duration, 1);
          node.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
        counterObserver.unobserve(node);
      });
    }, { threshold: 0.5 });
    counterObserver.observe(el);
  });

  function openModal() {
    if (!modal) return;
    scrollTopBeforeModal = window.pageYOffset;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
    window.scrollTo(0, scrollTopBeforeModal);
  }

  openBtns.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      const serviceVal = btn.getAttribute('data-service');
      if (serviceVal && serviceSelect) {
        const match = Array.from(serviceSelect.options).find(function (o) {
          return o.text.includes(serviceVal);
        });
        if (match) serviceSelect.value = match.value;
      }
      openModal();
    });
  });

  if (closeBtn) closeBtn.onclick = closeModal;
  if (modalBackdrop) modalBackdrop.onclick = closeModal;

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  const sections = document.querySelectorAll('section[id], article[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  function highlightNav() {
    let current = '';
    sections.forEach(function (section) {
      const top = section.offsetTop - 140;
      if (window.scrollY >= top) current = section.id;
    });
    navLinks.forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
  }
  window.addEventListener('scroll', highlightNav, { passive: true });

  navLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const offset = (header ? header.offsetHeight : 0) + 16;
      const y = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });

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

  function sendLeadViaGet(data) {
    const params = new URLSearchParams();
    Object.keys(data).forEach(function (key) {
      params.set(key, data[key] || '');
    });

    return new Promise(function (resolve, reject) {
      let iframe = document.getElementById('form-proxy-frame');
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'form-proxy-frame';
        iframe.name = 'form-proxy-frame';
        iframe.title = 'form-proxy';
        iframe.style.cssText = 'position:absolute;width:0;height:0;border:0;visibility:hidden';
        document.body.appendChild(iframe);
      }

      iframe.onload = function () {
        window.setTimeout(resolve, 300);
      };
      iframe.onerror = function () {
        reject(new Error('Send error'));
      };

      iframe.src = FORM_API + '?' + params.toString();
      window.setTimeout(resolve, 2500);
    });
  }

  async function sendLead(data) {
    if (!FORM_API) {
      throw new Error('FORM_API not configured');
    }
    await sendLeadViaGet(data);
  }

  function setLoading(form, loading) {
    const btn = form.querySelector('[type="submit"]');
    if (!btn) return;
    btn.disabled = loading;
    if (loading) {
      btn.dataset.orig = btn.textContent;
      btn.textContent = 'Отправка…';
    } else if (btn.dataset.orig) {
      btn.textContent = btn.dataset.orig;
    }
  }

  async function submitLead(form, payload, msg) {
    setLoading(form, true);
    try {
      if (!FORM_API) {
        alert(
          'Форма не подключена к Telegram.\n\n' +
          '1. Откройте script.google.com → Новый проект\n' +
          '2. Вставьте код из Premium/telegram-proxy.gs\n' +
          '3. Развернуть → Веб-приложение → Доступ: Все\n' +
          '4. Скопируйте URL в FORM_API в script.js\n\n' +
          'Без прокси из РФ Telegram API недоступен.'
        );
        return;
      }
      await sendLead(payload);
      alert(msg);
      form.reset();
      closeModal();
    } catch (err) {
      console.error(err);
      alert('Не удалось отправить: ' + (err.message || 'ошибка сети'));
    } finally {
      setLoading(form, false);
    }
  }

  function bindForm(id, getData, msg) {
    const form = document.getElementById(id);
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitLead(form, getData(), msg);
    });
  }

  bindForm('main-form', function () {
    return {
      name: document.getElementById('form-name')?.value.trim(),
      phone: document.getElementById('form-phone')?.value.trim(),
      service: document.getElementById('form-service')?.value,
      source: 'Контакты'
    };
  }, 'Спасибо! Заявка отправлена.');

  bindForm('modal-form', function () {
    return {
      name: document.getElementById('modal-name')?.value.trim(),
      phone: document.getElementById('modal-phone')?.value.trim(),
      service: document.getElementById('modal-service')?.value,
      source: 'Модальное окно'
    };
  }, 'Спасибо! Заявка отправлена.');
});
