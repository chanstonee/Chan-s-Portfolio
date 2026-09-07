const responsiveStyle = document.createElement('style');
responsiveStyle.dataset.chanstoneResponsiveFixes = '';
responsiveStyle.textContent = '@media(max-width:809.98px){.framer-ASjQE .framer-znsv7z{height:64px!important}}';
document.head?.append(responsiveStyle);

/* Small, editable adapter around the original published Framer runtime. */
(() => {
  const config = window.CHANSTONE_CONFIG;
  const recipient = config.email;
  const deferredAboutHash = (window.location.hash || '').toLowerCase() === '#about';

  // On a direct #about visit the browser scrolls before Framer's loading cover
  // has cleared, so the original one-shot text scramble finishes out of sight.
  // Defer only that initial anchor jump until the page is visible and mounted.
  if (deferredAboutHash) {
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`);
    window.addEventListener('load', () => {
      let attempts = 0;
      const revealAbout = () => {
        const about = document.getElementById('about');
        if (!about && attempts++ < 30) {
          window.setTimeout(revealAbout, 100);
          return;
        }
        if (!about) return;
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
          about.scrollIntoView({ block: 'start' });
          window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}#about`);
        }));
      };
      // The original intro animation clears at roughly six seconds.
      window.setTimeout(revealAbout, 6500);
    }, { once: true });
  }

  // Framer-hosted form submission is unavailable on a static host. Prepare an
  // email draft instead. Nothing is sent until the visitor sends it in their app.
  document.addEventListener('submit', event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!form.reportValidity()) return;
    const inputs = [...form.querySelectorAll('input:not([type=hidden]), textarea')];
    const name = inputs.find(el => el.tagName === 'INPUT' && el.type !== 'email')?.value.trim() || '';
    const email = inputs.find(el => el.type === 'email')?.value.trim() || '';
    const project = inputs.find(el => el.tagName === 'TEXTAREA')?.value.trim() || '';
    const subject = `[Portfolio] ${name}`;
    const body = `Name / Company: ${name}\nEmail: ${email}\n\n${project}`;
    const href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    let status = form.querySelector('[data-contact-status]');
    if (!status) {
      status = document.createElement('p');
      status.dataset.contactStatus = '';
      status.setAttribute('role', 'status');
      status.style.cssText = 'font:14px/1.6 monospace;color:inherit;text-align:center;max-width:100%;overflow-wrap:anywhere';
      form.append(status);
    }
    status.replaceChildren(document.createTextNode('메일 앱에서 내용을 확인하고 전송해 주세요. 자동으로 전송되지는 않습니다. '));
    const link = document.createElement('a');
    link.href = href;
    link.textContent = '메일 초안 다시 열기';
    status.append(link);
    window.location.href = href;
  }, true);

  function enhance(root) {
    if (!(root instanceof Element) && root !== document) return;
    for (const link of root.querySelectorAll('a[href="https://mail.naver.com/v2/new"]')) link.href = `mailto:${recipient}`;
    for (const menu of root.querySelectorAll('a[data-framer-name="menu"]')) {
      menu.setAttribute('aria-label', '메뉴 열기');
      menu.setAttribute('role', 'button');
    }
  }
  document.addEventListener('DOMContentLoaded', () => {
    enhance(document);
    new MutationObserver(mutations => {
      for (const mutation of mutations) for (const node of mutation.addedNodes) enhance(node);
    }).observe(document.body, { childList: true, subtree: true });
  });
})();
