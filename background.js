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

  const url = buildPermalink(data.email, data.token);
  await chrome.tabs.sendMessage(tab.id, { type: 'COPY_TO_CLIPBOARD', url });
});

function buildPermalink(email, token) {
  // authuser accepts the account email directly, which routes to the right
  // account by identity rather than by sign-in order. This keeps the link
  // portable across browsers/devices where the /u/<index>/ would differ.
  const authParam = email ? `?authuser=${encodeURIComponent(email)}` : '';
  return `https://mail.google.com/mail/${authParam}#${token}`;
}
