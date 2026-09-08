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
responsiveStyle.textContent = '@media(max-width:809.98px){.framer-ASjQE .framer-znsv7z{height:64px!important}}@media(min-width:1200px){a[data-chanstone-work-state="active"]{max-width:none!important}a[data-chanstone-work-state="inactive"]{max-width:216px!important}a[data-chanstone-work-state="active"] .framer-tGC3N,a[data-chanstone-work-state="active"] .framer-1bbhv8e{width:100%!important}a[data-chanstone-work-state="active"] .framer-9iqpm9-container{width:100%!important;opacity:1!important;visibility:visible!important}a[data-chanstone-work-state="active"] .framer-9iqpm9-container>*{background-color:rgb(36,36,36)!important}a[data-chanstone-work-state="inactive"] .framer-9iqpm9-container>*{background-color:rgb(158,158,158)!important}a[data-chanstone-work-state="active"] p.framer-text{--framer-text-color:rgb(36,36,36)!important;color:rgb(36,36,36)!important}a[data-chanstone-work-state="inactive"] p.framer-text{--framer-text-color:rgb(158,158,158)!important;color:rgb(158,158,158)!important}}';
document.head?.append(responsiveStyle);

/* Small, editable adapter around the original published Framer runtime. */
(() => {
  const config = window.CHANSTONE_CONFIG;
  const recipient = config.email;
  const deferredAboutHash = (window.location.hash || '').toLowerCase() === '#about';
  const deferredWorkHash = (window.location.hash || '').toLowerCase() === '#work';

  // Framer's router updates the hash for the Work menu, but its hydration
  // pass then restores the scroll position to the top of the document. Keep
  // the URL/hash behavior while explicitly positioning the page at the
  // SELECTED WORKS section (the element with id="work").
  let workScrollToken = 0;
  const normalizedPath = path => {
    const value = (path || '/').replace(/\/+$/, '');
    return value || '/';
  };
  const isWorkHashLink = href => {
    try {
      return new URL(href, document.baseURI).hash.toLowerCase() === '#work';
    } catch {
      return false;
    }
  };
  function scrollToWork({ smooth = false, url = null } = {}) {
    const work = document.getElementById('work');
    if (!work) return false;
    const top = Math.max(0, work.getBoundingClientRect().top + window.scrollY);
    window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
    if (url) {
      const next = `${url.pathname}${url.search}#work`;
      if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== next) {
        window.history.pushState(window.history.state, '', next);
      }
    }
    return true;
  }
  function scheduleWorkScroll(options = {}) {
    const token = ++workScrollToken;
    // The published Framer bundle can perform a second layout during
    // hydration. Re-apply the anchor after those layout passes have settled.
    [0, 120, 450, 1000, 2200].forEach(delay => {
      window.setTimeout(() => {
        if (token !== workScrollToken) return;
        scrollToWork(options);
      }, delay);
    });
  }

  if (deferredWorkHash) {
    // Prevent the browser's early native jump; Framer otherwise moves back to
    // the hero while mounting. The hash is restored once the section exists.
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`);
    const revealWork = () => scheduleWorkScroll({ smooth: false, url: new URL(window.location.href) });
    if (document.readyState === 'complete') window.setTimeout(revealWork, 250);
    else window.addEventListener('load', () => window.setTimeout(revealWork, 250), { once: true });
  }

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
  function revealStoreCard(card) {
    if (card.dataset.chanstoneStoreCard !== '1') return;
    // The cloned card is not registered with Framer's appear-animation
    // registry, so its copied opacity/translateY reveal state would remain
    // hidden forever. Reset only those copied reveal styles; the card still
    // keeps the same layout, hover, and image behavior at every breakpoint.
    for (const node of [card, ...card.querySelectorAll('*')]) {
      const computed = getComputedStyle(node);
      if (node === card || computed.opacity === '0') {
        node.style.opacity = '1';
        node.style.transform = 'none';
      }
    }
  }
  const projectSlug = card => (card.getAttribute('href') || '').match(/\/projects\/([^/?#]+)/)?.[1] || '';
  function bindDesktopWorkPreview(parent, base) {
    // The desktop preview is not inside a work-card: it is a sibling image
    // stack managed by Framer. The inserted 004 card has no Framer listeners,
    // so control the whole six-item desktop state in one small adapter.
    const desktop = parent.closest('.framer-1x51scc');
    const preview = desktop?.querySelector('[data-framer-name="image-wrapper"]');
    if (!preview) return;
    const cards = () => [...parent.querySelectorAll(':scope > a[data-framer-name^="block-holder-"][href*="/projects/"]')];
    if (!cards().some(card => projectSlug(card) === 'store36-5')) return;

    let overlay = preview.querySelector('img[data-chanstone-store-preview]');
    if (!overlay) {
      overlay = document.createElement('img');
      overlay.dataset.chanstoneStorePreview = '';
      overlay.decoding = 'async';
      overlay.alt = '';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.style.cssText = 'position:absolute;inset:0;z-index:99;display:block;width:100%;height:100%;object-fit:cover;opacity:0;visibility:hidden;pointer-events:none;transition:opacity 180ms ease';
      preview.append(overlay);
    }
    const layerSrc = name => preview.querySelector(`[data-framer-name="${name}"] img`)?.getAttribute('src') || '';
    const storePreviewSrc = `${base}assets/store365-thumbnail.png`;
    // Keep the new image decoded in the hidden overlay so the first hover does
    // not flash the old preview while a large image starts downloading.
    if (!overlay.getAttribute('src')) overlay.src = storePreviewSrc;
    const sources = {
      dssystem: layerSrc('img-1'),
      shmycar: layerSrc('img-2'),
      playon: layerSrc('img-3'),
      'store36-5': storePreviewSrc,
      gacha: layerSrc('img-5'),
      // Captain CRIX was the original fourth Framer preview before Store36.5
      // was inserted, so retain that source as the new sixth preview.
      'captain-crix': layerSrc('img-4'),
    };
    const setActive = slug => {
      const src = sources[slug] || '';
      if (!src) return;
      if (overlay.getAttribute('src') !== src) overlay.src = src;
      overlay.style.opacity = '1';
      overlay.style.visibility = 'visible';
      for (const card of cards()) {
        card.dataset.chanstoneWorkState = projectSlug(card) === slug ? 'active' : 'inactive';
      }
    };
    const clearActive = () => {
      overlay.style.opacity = '0';
      overlay.style.visibility = 'hidden';
      for (const card of cards()) delete card.dataset.chanstoneWorkState;
    };
    for (const card of cards()) {
      if (card.dataset.chanstoneDesktopPreviewBound === '1') continue;
      card.dataset.chanstoneDesktopPreviewBound = '1';
      const slug = projectSlug(card);
      card.addEventListener('pointerenter', () => setActive(slug));
      card.addEventListener('focusin', () => setActive(slug));
    }
    if (parent.dataset.chanstoneDesktopPreviewBound !== '1') {
      parent.dataset.chanstoneDesktopPreviewBound = '1';
      parent.addEventListener('pointerleave', clearActive);
      parent.addEventListener('focusout', event => {
        if (!parent.contains(event.relatedTarget)) clearActive();
      });
    }
  }
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
    const groups = new Map();
    for (const card of allCards) {
      const parent = card.parentElement;
      if (!parent) continue;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(card);
    }
    const base = window.CHANSTONE_CONFIG?.basePath || '/';
    let allReady = true;
    for (const [parent, cards] of groups) {
      const bySlug = new Map(cards.map(card => [projectSlug(card), card]));
      if (!bySlug.has('store36-5')) {
        const template = bySlug.get('gacha') || cards[cards.length - 1];
        if (!template) continue;
        const store = template.cloneNode(true);
        store.dataset.chanstoneStoreCard = '1';
        bySlug.set('store36-5', store);
      }
      const desired = specs.map(([slug]) => bySlug.get(slug)).filter(Boolean);
      const groupReady = desired.length === specs.length && desired.every((card, index) => {
        const [slug, number, title] = specs[index];
        const textNodes = card.querySelectorAll('p.framer-text');
        const imageSrc = card.querySelector('img')?.getAttribute('src') || '';
        return card.parentElement === parent
          && card.getAttribute('href') === `${base}projects/${slug}`
          && textNodes[0]?.textContent === number
          && textNodes[1]?.textContent === title
          && getComputedStyle(card).order === String(index)
          && (slug !== 'store36-5' || Boolean(card.closest('.framer-1x51scc')) || imageSrc.includes('store365-thumbnail.png'));
      });
      if (groupReady) {
        bindDesktopWorkPreview(parent, base);
        continue;
      }
      allReady = false;
      for (const [index, card] of desired.entries()) {
        const [slug, number, title] = specs[index];
        if (card.parentElement !== parent) parent.appendChild(card);
        if (card.dataset.framerName !== `block-holder-${index + 1}`) {
          card.dataset.framerName = `block-holder-${index + 1}`;
        }
        if (card.style.order !== String(index)) card.style.order = String(index);
        if (card.getAttribute('href') !== `${base}projects/${slug}`) card.href = `${base}projects/${slug}`;
        if (card.getAttribute('aria-label') !== `${number} ${title}`) {
          card.setAttribute('aria-label', `${number} ${title}`);
        }
        const textNodes = card.querySelectorAll('p.framer-text');
        if (textNodes[0]?.textContent !== number) textNodes[0].textContent = number;
        if (textNodes[1]?.textContent !== title) textNodes[1].textContent = title;
        if (slug === 'store36-5') {
          const image = card.querySelector('img');
          if (image) {
            const src = `${base}assets/store365-thumbnail.png`;
            if (image.getAttribute('src') !== src) image.src = src;
            const srcset = `${src} 512w,${src} 1024w,${src} 1448w`;
            if (image.getAttribute('srcset') !== srcset) image.srcset = srcset;
            if (image.alt !== 'STORE36.5 차세대 구축') image.alt = 'STORE36.5 차세대 구축';
          }
          revealStoreCard(card);
        }
      }
      // Reorder after Framer hydration has settled so keyboard and screen-reader
      // order matches the visual order as well as the CSS order.
      const current = [...parent.children].filter(node => desired.includes(node));
      if (current.length !== desired.length || current.some((card, index) => card !== desired[index])) {
        for (const card of desired) parent.appendChild(card);
      }
      bindDesktopWorkPreview(parent, base);
    }
    return allReady;
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
      if (isWorkHashLink(href) && !event.defaultPrevented && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
        const targetUrl = new URL(href, document.baseURI);
        if (targetUrl.origin === window.location.origin
          && normalizedPath(targetUrl.pathname) !== normalizedPath(window.location.pathname)) {
          // On a project page, the Work link first returns to the portfolio
          // home. Skip the one-shot loader because this is menu navigation.
          document.documentElement.dataset.chanstoneSkipLoader = '';
          event.preventDefault();
          event.stopImmediatePropagation();
          window.location.assign(`${targetUrl.pathname}${targetUrl.search}#work`);
          return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        scheduleWorkScroll({ smooth: true, url: targetUrl });
        return;
      }
      if (href.includes('/projects/')) {
        document.documentElement.dataset.chanstoneSkipLoader = '';
      }
    }, true);
    new MutationObserver(mutations => {
      for (const mutation of mutations) for (const node of mutation.addedNodes) enhance(node);
      // Framer can replace the active responsive variant after the initial
      // mount (for example after a viewport resize). Re-run the card adapter
      // so STORE36.5 is recreated and revealed in that newly mounted list.
      syncWorkCards();
      removeWorkCommentTargets();
    }).observe(document.body, { childList: true, subtree: true });
  });
})();
