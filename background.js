function createContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'gmail-copy-permalink',
      title: chrome.i18n.getMessage('contextMenuTitle') || 'Copy permalink',
      contexts: ['all'],
      documentUrlPatterns: ['https://mail.google.com/*'],
    });
  });
}

chrome.runtime.onInstalled.addListener(createContextMenu);
chrome.runtime.onStartup.addListener(createContextMenu);

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'gmail-copy-permalink') return;

  let data;
  try {
    data = await chrome.tabs.sendMessage(tab.id, { type: 'GET_LAST_MESSAGE_DATA' });
  } catch {
    return;
  }

  if (!data?.token) return;

  const url = buildPermalink(data.email, data.token, data.accountIndex);
  await chrome.tabs.sendMessage(tab.id, { type: 'COPY_TO_CLIPBOARD', url });
});

function buildPermalink(email, token, accountIndex) {
  // Prefer the explicit account index from the current URL. It reliably pins
  // the link to the right account when several are signed in, and doesn't
  // depend on scraping the account email from Gmail's markup.
  if (accountIndex != null) {
    return `https://mail.google.com/mail/u/${accountIndex}/#${token}`;
  }
  const authParam = email ? `?authuser=${encodeURIComponent(email)}` : '';
  return `https://mail.google.com/mail/${authParam}#${token}`;
}
