# Custom domain verification

Production: https://uav.sharik.dev/ → Cloudflare Worker `open-ecalc`.

Verified on 2026-09-29:

- Public DNS resolves to Cloudflare addresses.
- HTTPS root returns 200 with the application HTML. The favicon and manifest return the expected content types.
- agent-browser renders the calculator and calculates the 5000 mAh regression scenario: 5.9 min, 3.5 km usable range.
- Sending feedback through the UI produces the success message. The same-origin API accepts the request and the Worker sends the complete calculation document to Telegram.

An ordinary Chromium connection in the verification environment timed out even while curl succeeded. Disabling QUIC and mapping the hostname to a reachable Cloudflare edge allowed the browser test to complete with the original HTTPS hostname and certificate validation. This demonstrates a working deployment, but does not establish the cause of a connection failure on another network.

If the page does not open, compare another network/browser before changing DNS. Inspect the document and JavaScript requests separately; HTTP 200 for HTML alone is not proof that the app booted. Verify the hostname is assigned as a Custom Domain on `open-ecalc`, rather than a DNS record pointing at an unrelated origin.

The browser must never receive `TELEGRAM_BOT` or `ADMIN_USERID`. Those belong in Worker secrets. Feedback uses a relative `/api/feedback` URL so that it works on both the custom domain and workers.dev hostname.
