chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'gmail-copy-permalink',
    title: 'Copy permalink',
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

  const url = buildPermalink(data.auth, data.token);
  await chrome.tabs.sendMessage(tab.id, { type: 'COPY_TO_CLIPBOARD', url });
});

function buildPermalink(auth, token) {
  const authParam = auth !== null && auth !== undefined ? `?authuser=${auth}` : '';
  return `https://mail.google.com/mail/${authParam}#${token}`;
}
