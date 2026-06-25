# Gmail Extension

A browser extension for Gmail with two features:

1. **Copy permalink** — adds a right-click option to copy a permanent link to any email thread.
2. **Sender favicons** — shows a small favicon next to each sender, based on their email domain.

---

## What it does

### Copy permalink

Gmail doesn't make it easy to share a direct link to a specific email. The URL in your address bar depends on which folder or label you're in, which makes those links fragile. They break as soon as someone opens the email from a different view.

This extension adds **Copy permalink** to Gmail's right-click menu. When you right-click anywhere inside an email, you can copy a stable link that:

- Goes to that specific email thread
- Works regardless of which folder or label the recipient is viewing
- Pins to the account you're viewing (via the `authuser` parameter), so it opens correctly if you're signed into multiple Google accounts — personal and Workspace alike

The link uses Gmail's `#all/<token>` format, which bypasses folder routing.

### Sender favicons

Next to each sender — in both the message list and an open conversation — the extension shows a 16×16 favicon for that sender's email domain, fetched from Google's favicon service. It's a quick visual cue for who sent a message.

Free/shared email providers (gmail.com, outlook.com, …) are excluded by default, since their favicon reflects the provider rather than the sender. You can edit both the default exclusion list and your own custom exclusions from the extension's popup. Settings sync across your devices via `chrome.storage.sync`.

**Available in English and Dutch.**

---

## How to use it

### Copy permalink

1. Open [mail.google.com](https://mail.google.com) and open any email thread.
2. Right-click anywhere inside the email body or header.
3. Select **Copy permalink** from the context menu.
4. The link is in your clipboard. Paste it wherever you need it.

### Favicon settings

1. Click the extension's toolbar icon to open the popup.
2. Switch to the **Favicons** tab.
3. Edit the excluded email services or add your own custom domains (one per line), then click **Save**. Use **Reset to defaults** to restore the built-in service list.

---

## Installation

This extension isn't on the Chrome Web Store. You load it from the source code.

**Step 1 — Download the code**

Go to the [repository on GitHub](https://github.com/impca201/gmail-permalink-extension), click the green **Code** button, and choose **Download ZIP**. Extract it to a folder on your computer.

Or, if you have Git:

```bash
git clone https://github.com/impca201/gmail-permalink-extension.git
```

**Step 2 — Open the extensions page**

In Chrome, Edge, Brave, or any other Chromium browser, go to:

```
chrome://extensions
```

**Step 3 — Enable Developer mode**

Toggle on **Developer mode** in the top-right corner.

**Step 4 — Load the extension**

Click **Load unpacked** and select the folder from Step 1 (the one with `manifest.json` in it).

That's it. You'll now see **Copy permalink** in the right-click menu when you're in Gmail.

---

## Privacy

This extension runs in your browser and has no server of its own. The permalink feature reads the page URL to get the thread token and reads your account email from Gmail's interface, just to build the link — it stores nothing and sends nothing.

The favicon feature requests favicon images from Google's public favicon service (`google.com/s2/favicons`) using the sender's email domain. Your favicon exclusion settings are stored in `chrome.storage.sync` so they follow you across devices; nothing else is collected.

Because it works by reading Gmail's page structure, it can break if Google updates the Gmail interface. If something stops working, check the [issues page](https://github.com/impca201/gmail-permalink-extension/issues) or open a new one.

---

## Contributing

Pull requests and bug reports are welcome. If Gmail changed something that broke the extension, or you have an idea for an improvement, jump in.

→ [github.com/impca201/gmail-permalink-extension](https://github.com/impca201/gmail-permalink-extension)

---

## Support

If this has been useful and you'd like to say thanks:

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/impca)
