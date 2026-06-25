// Sender domain labels.
//
// Adds a small "label" chip — a domain favicon plus the domain name — as the
// first item among Gmail's own labels, in both the message list and the open
// conversation view. The plain favicon was too low-res to be useful on its own;
// pairing it with the domain text makes the sender's origin readable at a glance.
//
// Gmail is a single-page app that rewrites the DOM on navigation, so we watch
// document.body with a debounced MutationObserver rather than relying on a
// one-shot load event. Gmail's class names are obfuscated, so we anchor on the
// most stable hooks available (the `email` attribute and `[data-name]` label
// buttons) and degrade gracefully when a structural class shifts.

(function () {
  'use strict';

  const LABEL_CLASS = 'gx-domain-label';
  const DEBOUNCE_MS = 150;

  // Exclusion lists are merged into this set at runtime. Until storage loads we
  // keep the defaults so the first injection pass already behaves sanely.
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
        injectDomainLabels();
      }
    );
  }

  // Re-read settings and refresh when the user edits them in the popup. Existing
  // chips are dropped first so newly-excluded domains disappear immediately.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    if (changes[GX_STORAGE_KEYS.services] || changes[GX_STORAGE_KEYS.custom]) {
      document.querySelectorAll(`.${LABEL_CLASS}`).forEach((el) => el.remove());
      loadExclusions();
    }
  });

  function domainFromEmail(email) {
    if (!email) return null;
    const at = email.lastIndexOf('@');
    if (at === -1) return null;
    const domain = email.slice(at + 1).trim().toLowerCase();
    return domain || null;
  }

  function faviconUrl(domain) {
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
  }

  function buildLabel(domain) {
    const chip = document.createElement('span');
    chip.className = LABEL_CLASS;
    chip.dataset.gxDomain = domain;
    chip.title = domain;

    const img = document.createElement('img');
    img.className = 'gx-domain-favicon';
    img.src = faviconUrl(domain);
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    // No favicon? Drop the image but keep the readable domain text.
    img.addEventListener('error', () => img.remove());

    const text = document.createElement('span');
    text.className = 'gx-domain-text';
    text.textContent = domain;

    chip.append(img, text);
    return chip;
  }

  function usableDomain(email) {
    const domain = domainFromEmail(email);
    if (!domain || excludedDomains.has(domain)) return null;
    return domain;
  }

  // --- List / label overview ---------------------------------------------
  // Each row's subject cell (.xT) holds an optional labels container (.yi).
  // Inject the chip as the first label there; when a row has no labels we fall
  // back to the cell itself so the chip still leads the subject line.
  function injectListView() {
    for (const cell of document.querySelectorAll('.xT')) {
      if (cell.querySelector(`.${LABEL_CLASS}`)) continue;
      const row = cell.closest('[role="row"]') || cell.closest('tr');
      if (!row) continue;
      const senderEl = row.querySelector('[email]');
      const domain = senderEl && usableDomain(senderEl.getAttribute('email'));
      if (!domain) continue;
      const host = cell.querySelector('.yi') || cell;
      host.insertBefore(buildLabel(domain), host.firstChild);
    }
  }

  // The conversation's main sender — the name span in a message header carries
  // both `email` and the `gD` class. Fall back to any addressed element.
  function conversationSenderDomain() {
    const sender =
      document.querySelector('.gD[email]') || document.querySelector('[email]');
    return sender ? usableDomain(sender.getAttribute('email')) : null;
  }

  // --- Conversation view --------------------------------------------------
  // The thread's label strip is the parent of the per-label wrappers (.ahR),
  // each of which contains a [data-name] label button. Find those wrappers via
  // the buttons, then prepend the chip to their shared container.
  function injectConversationView() {
    const hosts = new Set();
    for (const btn of document.querySelectorAll('[data-name][role="button"]')) {
      const wrapper = btn.closest('.ahR');
      if (wrapper && wrapper.parentElement) hosts.add(wrapper.parentElement);
    }
    if (hosts.size === 0) return;

    const domain = conversationSenderDomain();
    if (!domain) return;

    for (const host of hosts) {
      if (host.querySelector(`.${LABEL_CLASS}`)) continue;
      host.insertBefore(buildLabel(domain), host.firstChild);
    }
  }

  function injectDomainLabels() {
    injectListView();
    injectConversationView();
  }

  function debounce(fn, wait) {
    let timer = null;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, wait);
    };
  }

  const observer = new MutationObserver(debounce(injectDomainLabels, DEBOUNCE_MS));
  observer.observe(document.body, { childList: true, subtree: true });

  loadExclusions();
})();
