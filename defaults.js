// Shared constants for the favicon feature. Loaded by both the content script
// and the popup so the default exclusion list lives in exactly one place.
const GX_STORAGE_KEYS = {
  services: 'favicon_exclude_services',
  custom: 'favicon_exclude_custom',
  enablePermalink: 'enable_permalink',
  enableSenderLabel: 'enable_sender_label',
};

// Feature toggles default to on, so existing users keep both features.
const GX_DEFAULT_ENABLED = {
  [GX_STORAGE_KEYS.enablePermalink]: true,
  [GX_STORAGE_KEYS.enableSenderLabel]: true,
};

// Common free/shared email providers. Their favicon is the provider's, not the
// sender's, so showing it would be misleading — excluded by default.
const GX_DEFAULT_EXCLUDE_SERVICES = [
  'gmail.com',
  'googlemail.com',
  'hotmail.com',
  'hotmail.be',
  'hotmail.fr',
  'outlook.com',
  'outlook.be',
  'live.com',
  'live.be',
  'yahoo.com',
  'yahoo.fr',
  'yahoo.be',
  'yahoo.co.uk',
  'icloud.com',
  'me.com',
  'mac.com',
  'protonmail.com',
  'proton.me',
  'tutanota.com',
  'zoho.com',
  'msn.com',
];
