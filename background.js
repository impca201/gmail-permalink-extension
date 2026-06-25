importScripts('defaults.js');

// Rebuild the context menu from the current toggle: present it only while the
// permalink feature is enabled.
function refreshContextMenu() {
  chrome.storage.sync.get(
    {
      [GX_STORAGE_KEYS.enablePermalink]:
        GX_DEFAULT_ENABLED[GX_STORAGE_KEYS.enablePermalink],
    },
    (settings) => {
      chrome.contextMenus.removeAll(() => {
        if (!settings[GX_STORAGE_KEYS.enablePermalink]) return;
        chrome.contextMenus.create({
          id: 'gmail-copy-permalink',
          title: chrome.i18n.getMessage('contextMenuTitle') || 'Copy permalink',
          contexts: ['all'],
          documentUrlPatterns: ['https://mail.google.com/*'],
        });
      });
    }
  );
}

chrome.runtime.onInstalled.addListener(refreshContextMenu);
chrome.runtime.onStartup.addListener(refreshContextMenu);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes[GX_STORAGE_KEYS.enablePermalink]) {
    refreshContextMenu();
  }
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
  // authuser accepts the account email directly, which routes to the right
  // account by identity rather than by sign-in order. This keeps the link
  // portable across browsers/devices where the /u/<index>/ would differ.
  const authParam = email ? `?authuser=${encodeURIComponent(email)}` : '';
  return `https://mail.google.com/mail/${authParam}#${token}`;
}
