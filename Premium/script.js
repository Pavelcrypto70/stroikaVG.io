const TELEGRAM = {
  BOT_TOKEN: '',
  CHAT_ID: ''
};

document.addEventListener('DOMContentLoaded', function () {
  const header = document.getElementById('siteHeader');
  const modal = document.getElementById('callbackModal');
  const modalBackdrop = modal?.querySelector('.modal-backdrop');
  const closeBtn = modal?.querySelector('.modal-close');
  const serviceSelect = document.getElementById('modal-service');
  const openBtns = document.querySelectorAll('.callback-open');
  let scrollTopBeforeModal = 0;

  /* Header scroll effect */
  function onScroll() {
    if (header) {
      header.classList.toggle('scrolled', window.scrollY > 40);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Reveal on scroll */
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

  /* Counter animation */
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

  /* Modal */
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

  /* Active nav link */
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

  /* Smooth scroll */
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

  /* Telegram forms */
  function isTelegramConfigured() {
    return Boolean(TELEGRAM.BOT_TOKEN && TELEGRAM.CHAT_ID);
  }

  async function sendToTelegram(data) {
    const url = 'https://api.telegram.org/bot' + TELEGRAM.BOT_TOKEN + '/sendMessage';
    const text = [
      '📋 Новая заявка — AcademiaStroy Premium',
      '',
      'Имя: ' + (data.name || '—'),
      'Телефон: ' + (data.phone || '—'),
      'Услуга: ' + (data.service || '—'),
      data.source ? 'Форма: ' + data.source : ''
    ].filter(Boolean).join('\n');

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM.CHAT_ID, text: text })
    });
    if (!res.ok) throw new Error('Telegram error');
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
      if (isTelegramConfigured()) await sendToTelegram(payload);
      alert(msg);
      form.reset();
      closeModal();
    } catch (err) {
      console.error(err);
      alert('Не удалось отправить. Попробуйте позже.');
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
