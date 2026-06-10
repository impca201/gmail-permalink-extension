let lastRightClickedMessage = null;

function getAccountEmail() {
  const emailEl = document.querySelector('[data-email]');
  if (emailEl?.dataset.email) return emailEl.dataset.email;

  const accountBtn = document.querySelector('[aria-label*="Google Account"]');
  if (accountBtn) {
    const match = accountBtn.getAttribute('aria-label').match(/\(([^)]+@[^)]+)\)/);
    if (match) return match[1];
  }

  return null;
}

function findMessageElement(target) {
  return target.closest('[data-legacy-message-id], [data-message-id]');
}

function getMessageToken(el) {
  return el.dataset.legacyMessageId || el.dataset.messageId || null;
}

document.addEventListener('contextmenu', (event) => {
  const messageEl = findMessageElement(event.target);
  if (!messageEl) {
    lastRightClickedMessage = null;
    return;
  }
  const token = getMessageToken(messageEl);
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
