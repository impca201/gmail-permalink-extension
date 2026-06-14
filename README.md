# Gmail Permalink Extension

A browser extension that adds a **Copy permalink** option to Gmail's right-click menu, so you can get a permanent link to any email thread in one click.

---

## What it does

Gmail doesn't make it easy to share a direct link to a specific email. The URL in your address bar depends on which folder or label you're in, which makes those links fragile. They break as soon as someone opens the email from a different view.

This extension adds **Copy permalink** to Gmail's right-click menu. When you right-click anywhere inside an email, you can copy a stable link that:

- Goes to that specific email thread
- Works regardless of which folder or label the recipient is viewing
- Includes your account identifier, so it opens correctly if you're signed into multiple Google accounts

The link uses Gmail's `#all/<token>` format, which bypasses folder routing.

**Available in English and Dutch.**

---

## How to use it

1. Open [mail.google.com](https://mail.google.com) and open any email thread.
2. Right-click anywhere inside the email body or header.
3. Select **Copy permalink** from the context menu.
4. The link is in your clipboard. Paste it wherever you need it.

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

This extension runs in your browser. It doesn't send data anywhere and has no server. It reads the page URL to get the thread token and reads your account email from Gmail's interface, just to build the link. It stores nothing and sends nothing.

Because it works by reading Gmail's page structure, it can break if Google updates the Gmail interface. If something stops working, check the [issues page](https://github.com/impca201/gmail-permalink-extension/issues) or open a new one.

---

## Contributing

Pull requests and bug reports are welcome. If Gmail changed something that broke the extension, or you have an idea for an improvement, jump in.

→ [github.com/impca201/gmail-permalink-extension](https://github.com/impca201/gmail-permalink-extension)

---

## Support

If this has been useful and you'd like to say thanks:

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/impca)
