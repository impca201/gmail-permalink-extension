chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'gmail-copy-permalink',
    title: chrome.i18n.getMessage('contextMenuTitle'),
    contexts: ['all'],
    documentUrlPatterns: ['https://mail.google.com/*'],
  });
});

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
  const authParam = email ? `?authuser=${encodeURIComponent(email)}` : '';
  return `https://mail.google.com/mail/${authParam}#${token}`;
}
