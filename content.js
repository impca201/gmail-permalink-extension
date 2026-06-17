let lastRightClickedMessage = null;

function getAccountEmail() {
  // The account switcher button links to SignOutOptions regardless of UI language.
  // Its aria-label contains the email in parentheses, e.g. "Google-account: Name (email@domain.com)"
  const btn = document.querySelector('a[href*="SignOutOptions"]');
  if (btn) {
    const match = btn.getAttribute('aria-label')?.match(/\(([^)]+@[^)]+)\)/);
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

// Gmail puts the signed-in account index in the URL path: /mail/u/<index>/.
// Reusing it makes the permalink open in the right account when several are
// signed in (e.g. a personal account alongside a Workspace one). Without it,
// a bare mail.google.com/mail/ URL always opens the default account (u/0),
// so the thread isn't found in any other account.
function getAccountIndex() {
  const match = location.pathname.match(/\/mail\/u\/(\d+)\//);
  return match ? match[1] : null;
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
  lastRightClickedMessage = token
    ? { token, email: getAccountEmail(), accountIndex: getAccountIndex() }
    : null;
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
