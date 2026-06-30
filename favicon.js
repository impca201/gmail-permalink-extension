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

  // Second-level public suffixes where the registrable domain is the last three
  // labels (e.g. yahoo.co.uk), not the last two. Not exhaustive — it's a small
  // heuristic covering the common cases, including the .co.uk default exclusion.
  const MULTI_PART_TLDS = new Set([
    'co.uk', 'org.uk', 'me.uk', 'ltd.uk', 'plc.uk', 'net.uk', 'sch.uk', 'ac.uk', 'gov.uk',
    'co.jp', 'or.jp', 'ne.jp', 'ac.jp', 'go.jp',
    'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au',
    'co.nz', 'net.nz', 'org.nz',
    'co.za', 'org.za',
    'com.br', 'net.br', 'org.br',
    'co.in', 'net.in', 'org.in',
    'com.cn', 'net.cn', 'org.cn',
    'com.mx', 'com.ar', 'com.tr', 'com.sg', 'com.hk', 'com.tw', 'com.my',
    'co.kr', 'or.kr',
  ]);

  // Exclusion lists are merged into this set at runtime. Until storage loads we
  // keep the defaults so the first injection pass already behaves sanely.
  let excludedDomains = new Set(GX_DEFAULT_EXCLUDE_SERVICES);
  let enabled = GX_DEFAULT_ENABLED[GX_STORAGE_KEYS.enableSenderLabel];

  function rebuildExclusions(services, custom) {
    const merged = [...(services || []), ...(custom || [])]
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);
    excludedDomains = new Set(merged);
  }

  function removeAllChips() {
    document.querySelectorAll(`.${LABEL_CLASS}`).forEach((el) => el.remove());
  }

  function loadSettings(afterLoad) {
    chrome.storage.sync.get(
      {
        [GX_STORAGE_KEYS.services]: GX_DEFAULT_EXCLUDE_SERVICES,
        [GX_STORAGE_KEYS.custom]: [],
        [GX_STORAGE_KEYS.enableSenderLabel]:
          GX_DEFAULT_ENABLED[GX_STORAGE_KEYS.enableSenderLabel],
      },
      (stored) => {
        rebuildExclusions(
          stored[GX_STORAGE_KEYS.services],
          stored[GX_STORAGE_KEYS.custom]
        );
        enabled = stored[GX_STORAGE_KEYS.enableSenderLabel];
        if (afterLoad) afterLoad();
      }
    );
  }

  // React to popup edits: rebuild chips so newly-excluded domains disappear and
  // the feature toggle takes effect immediately.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    const relevant =
      changes[GX_STORAGE_KEYS.services] ||
      changes[GX_STORAGE_KEYS.custom] ||
      changes[GX_STORAGE_KEYS.enableSenderLabel];
    if (!relevant) return;
    removeAllChips();
    loadSettings(() => {
      if (enabled) injectDomainLabels();
    });
  });

  function domainFromEmail(email) {
    if (!email) return null;
    const at = email.lastIndexOf('@');
    if (at === -1) return null;
    const domain = email.slice(at + 1).trim().toLowerCase();
    return domain || null;
  }

  // Collapse a subdomain to its registrable ("main") domain, so a sender at
  // mail.example.com is shown and looked up as example.com.
  function registrableDomain(domain) {
    const parts = domain.split('.');
    if (parts.length <= 2) return domain;
    const lastTwo = parts.slice(-2).join('.');
    if (MULTI_PART_TLDS.has(lastTwo)) return parts.slice(-3).join('.');
    return lastTwo;
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
    img.onerror = () => img.remove();

    const text = document.createElement('span');
    text.className = 'gx-domain-text';
    text.textContent = domain;

    chip.append(img, text);
    return chip;
  }

  // Resolve an address to the registrable domain to display, or null if excluded.
  // Exclusions are matched against both the full domain and the registrable one,
  // so a user can exclude either "example.com" or a specific "sub.example.com".
  function usableDomain(email) {
    const full = domainFromEmail(email);
    if (!full) return null;
    const root = registrableDomain(full);
    if (excludedDomains.has(full) || excludedDomains.has(root)) return null;
    return root;
  }

  // An element Gmail keeps in the DOM but hidden (e.g. a previously-opened
  // conversation) has no layout box. Skipping these is what keeps a stale
  // thread's sender from leaking into the current one.
  function isVisible(el) {
    return el.offsetParent !== null || el.getClientRects().length > 0;
  }

  // Resolve which domain to show under `root`. Scanning every addressed element
  // (not just the first) means a thread where you are the first sender still
  // resolves to the external participant. With `requireVisible`, hidden
  // (off-screen/cached) elements are ignored. The tri-state return distinguishes
  // the two reasons there's no domain, which is what kills the list-view flicker:
  //   string -> show this domain
  //   ''     -> addressed elements exist but all are excluded: clear the chip
  //   null   -> Gmail hasn't populated an address here yet: leave the chip as-is
  function resolveDomain(root, requireVisible) {
    let seen = false;
    for (const el of root.querySelectorAll('[email]')) {
      if (requireVisible && !isVisible(el)) continue;
      seen = true;
      const domain = usableDomain(el.getAttribute('email'));
      if (domain) return domain;
    }
    return seen ? '' : null;
  }

  // Reconcile the chip under `scope` with `domain`, inserting fresh chips at the
  // front of `anchor`. Gmail recycles row and label-strip elements across
  // navigation, so a stale chip from a previous conversation can linger on a
  // reused host — comparing the domain rids us of it. A null domain means the
  // address hasn't loaded yet, so we keep any existing chip rather than flicker.
  function applyChip(scope, anchor, domain) {
    if (domain === null) return;
    const existing = scope.querySelector(`.${LABEL_CLASS}`);
    if (existing) {
      if (existing.dataset.gxDomain === domain) return;
      existing.remove();
    }
    if (domain) anchor.insertBefore(buildLabel(domain), anchor.firstChild);
  }

  // --- List / label overview ---------------------------------------------
  // Each row's subject cell (.xT) holds an optional labels container (.yi).
  // Inject the chip as the first label there; when a row has no labels we fall
  // back to the cell itself so the chip still leads the subject line.
  function injectListView() {
    for (const cell of document.querySelectorAll('.xT')) {
      const row = cell.closest('[role="row"]') || cell.closest('tr');
      if (!row) continue;
      // Search on the cell so an existing chip is found even if Gmail added or
      // removed the .yi labels container since the last pass; insert into .yi
      // when present so the chip leads the labels, else into the cell itself.
      const host = cell.querySelector('.yi') || cell;
      applyChip(cell, host, resolveDomain(row, false));
    }
  }

  // The conversation's external party, scoped to the open thread. Gmail keeps
  // previously-viewed conversations in the DOM, so searching the whole document
  // would pick an earlier thread's sender (the "cached label" bug). Climb from
  // the label strip until an ancestor contains a *visible* addressed element:
  // the prior thread's senders are hidden, so they're skipped, and a shared
  // ancestor no longer leaks the wrong domain.
  function conversationSenderDomainFor(host) {
    let seen = false;
    for (let node = host; node && node !== document.body; node = node.parentElement) {
      for (const el of node.querySelectorAll('[email]')) {
        if (!isVisible(el)) continue;
        seen = true;
        const domain = usableDomain(el.getAttribute('email'));
        if (domain) return domain;
      }
    }
    // '' clears a stale chip once the thread is visible but has no usable sender;
    // null (nothing visible yet) keeps the current chip while the thread loads.
    return seen ? '' : null;
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
    for (const host of hosts) {
      applyChip(host, host, conversationSenderDomainFor(host));
    }
  }

  function injectDomainLabels() {
    if (!enabled) return;
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

  loadSettings(injectDomainLabels);
})();
