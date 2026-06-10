let lastRightClickedMessage = null;

function getAccountEmail() {
  // Try hovercard ID (present on account avatar/name elements)
  const hoverEl = document.querySelector('[data-hovercard-id*="@"]');
  if (hoverEl?.dataset.hovercardId) return hoverEl.dataset.hovercardId;

  // Try title attribute containing an email
  for (const el of document.querySelectorAll('[title]')) {
    if (/@/.test(el.title)) return el.title;
  }

  // Fall back to numeric account index from URL (e.g. /u/0/ → authuser=0)
  const match = location.pathname.match(/\/u\/(\d+)\//);
  return match ? match[1] : null;
}

// Read the thread/message token directly from the URL hash.
// Gmail hash format: #<folder>/<token> or #<token>
function getTokenFromUrl() {
  const hash = location.hash.replace(/^#/, '');
  const parts = hash.split('/');
  // Last non-empty segment is the token (e.g. "FMfcgzQ...")
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i]) return parts[i];
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
