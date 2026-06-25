// Sender favicon injection.
//
// Adds a small domain favicon next to sender email addresses in Gmail's list
// view and conversation view. Gmail is a single-page app that rewrites the DOM
// on navigation, so we watch document.body with a debounced MutationObserver
// rather than relying on a one-shot load event.

(function () {
  'use strict';

  const FAVICON_CLASS = 'gx-favicon';
  const DEBOUNCE_MS = 150;

  // Exclusion lists are merged into this set at runtime. Until storage loads we
  // keep the defaults so the very first injection pass already behaves sanely.
  let excludedDomains = new Set(GX_DEFAULT_EXCLUDE_SERVICES);

  function rebuildExclusions(services, custom) {
    const merged = [...(services || []), ...(custom || [])]
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);
    excludedDomains = new Set(merged);
  }

  function loadExclusions() {
    chrome.storage.sync.get(
      {
        [GX_STORAGE_KEYS.services]: GX_DEFAULT_EXCLUDE_SERVICES,
        [GX_STORAGE_KEYS.custom]: [],
      },
      (stored) => {
        rebuildExclusions(
          stored[GX_STORAGE_KEYS.services],
          stored[GX_STORAGE_KEYS.custom]
        );
        injectFavicons();
      }
    );
  }

  // Re-read settings and refresh when the user edits them in the popup.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    if (changes[GX_STORAGE_KEYS.services] || changes[GX_STORAGE_KEYS.custom]) {
      loadExclusions();
    }
  });

  function domainFromEmail(email) {
    const at = email.lastIndexOf('@');
    if (at === -1) return null;
    const domain = email.slice(at + 1).trim().toLowerCase();
    return domain || null;
  }

  function faviconUrl(domain) {
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=16`;
  }

  function buildFavicon(domain) {
    const img = document.createElement('img');
    img.className = FAVICON_CLASS;
    img.src = faviconUrl(domain);
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.dataset.gxDomain = domain;
    return img;
  }

  // Insert a favicon before `el`, unless its parent already carries one. The
  // idempotency check keys on the parent so repeated observer passes don't
  // stack duplicates.
  function injectInto(el, domain) {
    if (!domain || excludedDomains.has(domain)) return;
    const parent = el.parentElement;
    if (!parent || parent.querySelector(`.${FAVICON_CLASS}`)) return;
    parent.insertBefore(buildFavicon(domain), el);
  }

  function injectFavicons() {
    // Gmail's class names are obfuscated, so target stable attributes instead.
    // List view: sender cells expose the address via an `email` attribute.
    // Conversation view: the sender span carries `data-hovercard-id` (the
    // address) and/or `email`.
    const selector = '[email], [data-hovercard-id]';
    for (const el of document.querySelectorAll(selector)) {
      if (el.classList.contains(FAVICON_CLASS)) continue;
      const raw =
        el.getAttribute('email') || el.getAttribute('data-hovercard-id') || '';
      // data-hovercard-id is sometimes a group id rather than an email.
      if (!raw.includes('@')) continue;
      injectInto(el, domainFromEmail(raw));
    }
  }

  function debounce(fn, wait) {
    let timer = null;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, wait);
    };
  }

  const observer = new MutationObserver(debounce(injectFavicons, DEBOUNCE_MS));
  observer.observe(document.body, { childList: true, subtree: true });

  loadExclusions();
})();
