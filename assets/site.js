(() => {
  'use strict';
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');
  const closeMenu = () => {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Menüyü aç');
    nav.classList.remove('is-open');
  };
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
    nav?.classList.toggle('is-open', open);
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      toggle.focus();
    }
  });
  document.addEventListener('click', event => {
    if (toggle && nav && !toggle.contains(event.target) && !nav.contains(event.target)) closeMenu();
  });
  window.matchMedia('(min-width: 901px)').addEventListener('change', closeMenu);

  const form = document.querySelector('#contact-form');
  if (!form || !window.fetch) return;
  const button = form.querySelector('button[type="submit"]');
  const status = document.querySelector('#form-status');
  const originalButton = button.innerHTML;
  let sending = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || !form.reportValidity()) return;
    // A filled honeypot should never send an external request.
    if (form.elements._gotcha.value) return;
    sending = true;
    button.disabled = true;
    button.textContent = 'Gönderiliyor…';
    status.textContent = '';
    status.classList.remove('error', 'success');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(form.action, {
        method: 'POST', body: new FormData(form),
        headers: { Accept: 'application/json' }, signal: controller.signal
      });
      if (!response.ok) {
        if (response.status === 429) throw new Error('rate_limit');
        throw new Error('submission_failed');
      }
      form.reset();
      status.classList.add('success');
      status.textContent = 'Mesajınız gönderildi. Bizimle paylaştığınız için teşekkür ederiz.';
    } catch (error) {
      status.classList.add('error');
      status.textContent = error.message === 'rate_limit'
        ? 'Şu anda çok fazla istek var. Biraz sonra tekrar deneyin veya e-posta gönderin.'
        : 'Gönderim doğrulanamadı. Mesajınız korunuyor; tekrar deneyebilir veya anilavcidev@gmail.com adresine yazabilirsiniz.';
    } finally {
      window.clearTimeout(timeout);
      sending = false;
      button.disabled = false;
      button.innerHTML = originalButton;
      status.focus();
    }
  });
})();
