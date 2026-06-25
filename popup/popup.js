// Popup: two tabs. Permalink is informational (the feature is driven entirely
// by the context menu). Favicons exposes the two editable exclusion lists,
// persisted to chrome.storage.sync.

const servicesEl = document.getElementById('services');
const customEl = document.getElementById('custom');
const statusEl = document.getElementById('status');
const permalinkToggle = document.getElementById('enable-permalink');
const senderLabelToggle = document.getElementById('enable-sender-label');

function linesToList(text) {
  return text
    .split('\n')
    .map((line) => line.trim().toLowerCase())
    .filter(Boolean);
}

function listToLines(list) {
  return (list || []).join('\n');
}

// --- Tabs ---------------------------------------------------------------
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const name = tab.dataset.tab;
    document
      .querySelectorAll('.tab')
      .forEach((t) => t.classList.toggle('is-active', t === tab));
    document
      .querySelectorAll('.panel')
      .forEach((p) => p.classList.toggle('is-active', p.dataset.panel === name));
  });
});

// --- Settings -----------------------------------------------------------
function load() {
  chrome.storage.sync.get(
    {
      [GX_STORAGE_KEYS.services]: GX_DEFAULT_EXCLUDE_SERVICES,
      [GX_STORAGE_KEYS.custom]: [],
      [GX_STORAGE_KEYS.enablePermalink]:
        GX_DEFAULT_ENABLED[GX_STORAGE_KEYS.enablePermalink],
      [GX_STORAGE_KEYS.enableSenderLabel]:
        GX_DEFAULT_ENABLED[GX_STORAGE_KEYS.enableSenderLabel],
    },
    (stored) => {
      servicesEl.value = listToLines(stored[GX_STORAGE_KEYS.services]);
      customEl.value = listToLines(stored[GX_STORAGE_KEYS.custom]);
      permalinkToggle.checked = stored[GX_STORAGE_KEYS.enablePermalink];
      senderLabelToggle.checked = stored[GX_STORAGE_KEYS.enableSenderLabel];
    }
  );
}

// Toggles persist immediately so the feature reacts without needing Save.
permalinkToggle.addEventListener('change', () => {
  chrome.storage.sync.set({
    [GX_STORAGE_KEYS.enablePermalink]: permalinkToggle.checked,
  });
});

senderLabelToggle.addEventListener('change', () => {
  chrome.storage.sync.set({
    [GX_STORAGE_KEYS.enableSenderLabel]: senderLabelToggle.checked,
  });
});

function flash(message) {
  statusEl.textContent = message;
  setTimeout(() => {
    statusEl.textContent = '';
  }, 2000);
}

document.getElementById('save').addEventListener('click', () => {
  chrome.storage.sync.set(
    {
      [GX_STORAGE_KEYS.services]: linesToList(servicesEl.value),
      [GX_STORAGE_KEYS.custom]: linesToList(customEl.value),
    },
    () => flash('Saved')
  );
});

document.getElementById('reset-services').addEventListener('click', () => {
  servicesEl.value = listToLines(GX_DEFAULT_EXCLUDE_SERVICES);
});

load();
