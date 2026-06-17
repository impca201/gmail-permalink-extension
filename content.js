let lastRightClickedMessage = null;

function getAccountEmail() {
  // The Google account switcher button exposes the signed-in address in its
  // aria-label, e.g. "Google-account: Name (email@domain.com)", regardless of
  // UI language. The link's href has changed across Gmail versions (it used to
  // point at SignOutOptions), so match on the aria-label pattern instead: any
  // element whose label contains an email in parentheses.
  for (const el of document.querySelectorAll('[aria-label]')) {
    const match = el.getAttribute('aria-label')?.match(/\(([^()\s]+@[^()\s]+)\)/);
    if (match) return match[1];
  }
  return null;
}

// Extract the thread token from the URL hash and return it with
// a folder-independent prefix so the link works from any label.
// Gmail hash format: #<folder>/<token>
function getTokenFromUrl() {
  const hash = location.hash.replace(/^#/, '');
  const parts = hash.split('/');
  // Last non-empty segment is the token (e.g. "FMfcgzQ...")
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i]) return `all/${parts[i]}`;
  }
  return null;
}

function findMessageElement(target) {
  return target.closest('[data-legacy-message-id], [data-message-id]');
}

document.addEventListener('contextmenu', (event) => {
  const messageEl = findMessageElement(event.target);
  if (!messageEl) {
    lastRightClickedMessage = null;
    return;
  }
  const token = getTokenFromUrl();
  lastRightClickedMessage = token ? { token, email: getAccountEmail() } : null;
}, true);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_LAST_MESSAGE_DATA') {
    sendResponse(lastRightClickedMessage);
    return;
  }
  if (message.type === 'COPY_TO_CLIPBOARD') {
    navigator.clipboard.writeText(message.url)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
});
