let lastRightClickedMessage = null;

// Extract the thread token from the URL hash with a folder-independent prefix.
// Gmail hash formats: #inbox/TOKEN, #label/NAME/TOKEN, #all/TOKEN, etc.
function getTokenFromUrl() {
  const hash = location.hash.replace(/^#/, '');
  const parts = hash.split('/');
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
  lastRightClickedMessage = token ? { token } : null;
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
