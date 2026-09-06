/* Small, editable adapter around the original published Framer runtime. */
(() => {
  const config = window.CHANSTONE_CONFIG;
  const recipient = config.email;

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
