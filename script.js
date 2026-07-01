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

  function handleFormSubmit(formId, message){
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', function(e){
      e.preventDefault();
      alert(message);
      form.reset();
      if (modal && modal.style.display === 'flex') closeModal();
    });
  }

  handleFormSubmit('main-form', 'Спасибо! Заявка отправлена.');
  handleFormSubmit('modal-form', 'Спасибо! Заявка отправлена.');

  const checklistForm = document.getElementById('checklist-form');
  if (checklistForm){
    checklistForm.addEventListener('submit', function(e){
      e.preventDefault();
      alert('PDF отправлен на email.');
      checklistForm.reset();
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