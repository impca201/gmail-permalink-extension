let lastRightClickedMessage = null;

function getAccountEmail() {
  // Find hovercard emails that are NOT inside a message element (those are senders).
  // The logged-in account's hovercard lives in the page header.
  for (const el of document.querySelectorAll('[data-hovercard-id]')) {
    const id = el.dataset.hovercardId;
    if (id?.includes('@') && !el.closest('[data-legacy-message-id], [data-message-id]')) {
      return id;
    }
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
