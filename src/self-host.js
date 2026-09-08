const loaderSeenKey = 'chanstone-loader-seen';
let skipLoader = false;
try {
  if (window.sessionStorage) {
    skipLoader = window.sessionStorage.getItem(loaderSeenKey) === '1';
    window.sessionStorage.setItem(loaderSeenKey, '1');
  } else {
    throw new Error('sessionStorage unavailable');
  }
} catch {
  // Some embedded browsers disable web storage; window.name still survives navigation.
  try {
    skipLoader = window.name.includes(loaderSeenKey);
    if (!skipLoader) window.name = `${window.name}|${loaderSeenKey}`;
  } catch {
    // Browsers with both storage mechanisms blocked keep the original behavior.
  }
}
const loaderStyle = document.createElement('style');
loaderStyle.dataset.chanstoneLoaderFix = '';
loaderStyle.textContent = 'html[data-chanstone-skip-loader] [data-framer-name="loader"],html[data-chanstone-skip-loader] .framer-fm6xut-container{display:none!important;visibility:hidden!important;pointer-events:none!important}';
document.head?.append(loaderStyle);
if (skipLoader) document.documentElement.dataset.chanstoneSkipLoader = '';

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
  let workCardSyncTimer;
  function syncWorkCards() {
    // The published CMS list is static, so keep the editable project order and
    // copy in one small adapter. This runs for every responsive variant that
    // Framer mounts and is idempotent after the first pass.
    const allCards = [...document.querySelectorAll('a[data-framer-name^="block-holder-"][href*="/projects/"]')];
    if (!allCards.length) return false;
    const specs = [
      ['dssystem', '001', 'MTS DESIGN SYSTEM'],
      ['shmycar', '002', 'UX CONSULTING & UT'],
      ['playon', '003', 'AI PHOTOBOOTH'],
      ['store36-5', '004', 'STORE36.5'],
      ['gacha', '005', 'GACHA APP [AIGC]'],
      ['captain-crix', '006', 'IPX운세앱 [AIGC]'],
    ];
    const slugOf = card => (card.getAttribute('href') || '').match(/\/projects\/([^/?#]+)/)?.[1] || '';
    const ready = allCards.length === specs.length && specs.every(([slug, number, title], index) => {
      const card = allCards.find(item => slugOf(item) === slug);
      return card && card.innerText.includes(number) && card.innerText.includes(title)
        && getComputedStyle(card).order === String(index)
        && (slug !== 'store36-5' || card.querySelector('img')?.getAttribute('src')?.includes('store365-01.png'));
    });
    if (ready) return true;
    const groups = new Map();
    for (const card of allCards) {
      const parent = card.parentElement;
      if (!parent) continue;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(card);
    }
    const base = window.CHANSTONE_CONFIG?.basePath || '/';
    for (const [parent, cards] of groups) {
      const bySlug = new Map(cards.map(card => [slugOf(card), card]));
      if (!bySlug.has('store36-5')) {
        const template = bySlug.get('gacha') || cards[cards.length - 1];
        if (!template) continue;
        const store = template.cloneNode(true);
        store.dataset.chanstoneStoreCard = '1';
        bySlug.set('store36-5', store);
      }
      const desired = [];
      for (const [slug, number, title] of specs) {
        const card = bySlug.get(slug);
        if (!card) continue;
        if (card.parentElement !== parent) parent.appendChild(card);
        card.dataset.framerName = `block-holder-${desired.length + 1}`;
        card.style.order = String(desired.length);
        card.href = `${base}projects/${slug}`;
        card.setAttribute('aria-label', `${number} ${title}`);
        const textNodes = card.querySelectorAll('p.framer-text');
        if (textNodes[0]) textNodes[0].textContent = number;
        if (textNodes[1]) textNodes[1].textContent = title;
        if (slug === 'store36-5') {
          const image = card.querySelector('img');
          if (image) {
            const src = `${base}assets/store365-01.png`;
            image.src = src;
            image.srcset = `${src} 512w,${src} 1024w,${src} 1448w`;
            image.alt = 'STORE36.5 차세대 구축';
          }
        }
        desired.push(card);
      }
      // Reorder after Framer hydration has settled so keyboard and screen-reader
      // order matches the visual order as well as the CSS order.
      const current = [...parent.children].filter(node => desired.includes(node));
      if (current.length !== desired.length || current.some((card, index) => card !== desired[index])) {
        for (const card of desired) parent.appendChild(card);
      }
    }
    return false;
  }
  function startWorkCardSync() {
    let attempts = 0;
    const run = () => {
      if (syncWorkCards() || ++attempts >= 20) return;
      workCardSyncTimer = window.setTimeout(run, 500);
    };
    workCardSyncTimer = window.setTimeout(run, 2200);
  }
  function removeWorkCommentTargets() {
    if (!window.location.pathname.includes('/projects/')) return;
    for (const nextProject of document.querySelectorAll('.framer-jwrgza')) nextProject.remove();
    for (const middle of document.querySelectorAll('header.framer-mts1ep')) {
      middle.querySelector('.framer-1yj6s5g')?.remove();
      if (!middle.textContent.trim()) middle.remove();
    }
    for (const spacer of document.querySelectorAll('.framer-cu5e7i, .framer-1l3wpu7')) {
      if (!spacer.textContent.trim() && !spacer.querySelector('img,video,a,canvas,svg')) spacer.remove();
    }
  }
  document.addEventListener('DOMContentLoaded', () => {
    enhance(document);
    startWorkCardSync();
    removeWorkCommentTargets();
    document.addEventListener('click', event => {
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!anchor) return;
      const href = anchor.getAttribute('href') || '';
      if (href.includes('/projects/')) {
        document.documentElement.dataset.chanstoneSkipLoader = '';
      }
    }, true);
    new MutationObserver(mutations => {
      for (const mutation of mutations) for (const node of mutation.addedNodes) enhance(node);
      removeWorkCommentTargets();
    }).observe(document.body, { childList: true, subtree: true });
  });
})();
