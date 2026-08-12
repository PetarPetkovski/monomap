# Deploying MonoMap to CloudPanel / nginx

MonoMap builds to a **fully static site** (no server-side runtime, no database). The production build is
the `build/` folder produced by `npm run build`. Deployment is: copy `build/` to the nginx document root and
apply the included nginx config.

**Important:** I cannot connect to your server (no SSH/FTP from this environment), so the last mile — the
actual upload — needs to be done by you. Everything else is prepared and ready below.

---

## 0. Build the site

Run once on a machine with the repo + Node:

```bash
npm ci          # install dependencies
npm run build   # produces ./build/
```

The output contains: `index.html` (landing, prerendered), `workspace.html` (the app), `200.html` (SPA fallback),
`robots.txt`, `sitemap.xml`, `og-image.png`, and `/_app/` (hashed assets).

---

## 1. CloudPanel — create the website

1. In CloudPanel: **Websites → Add Website**.
2. Choose **PHP or Static** (no PHP needed — pick "Static" or "HTML" if offered; otherwise PHP is fine,
   it will just not execute).
3. Domain: `monomap.app` (and alias `www.monomap.app`).
4. Note the document root path CloudPanel creates (usually
   `/home/<username>/htdocs/monomap.app`).

---

## 2. Upload the build

Upload the **contents of `build/`** (not the folder itself) into the document root, so that
`index.html`, `workspace.html`, `200.html`, `robots.txt`, etc. sit directly in the root.

You can use any of:
- **CloudPanel File Manager** (easiest — drag & drop),
- **FTP/SFTP** (CloudPanel shows the credentials under Websites → the site → FTP/SFTP),
- or on the server itself: `git clone` the repo and `npm run build`, then copy `build/*` to the root.

Verify: `https://monomap.app/robots.txt` and `https://monomap.app/sitemap.xml` return 200.

---

## 3. Apply the nginx config

Open the site's **nginx** settings in CloudPanel and add the directives from
[`deploy/nginx.conf.example`](deploy/nginx.conf.example) — the key parts:

```nginx
root /home/<username>/htdocs/monomap.app;   # match your actual root

# SPA fallback so the app and deep links work
location / {
    try_files $uri $uri/ /200.html;
}

# Hashed build assets: cache hard
location /_app/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    try_files $uri =404;
}
```

Also add the **security headers** (X-Content-Type-Options, X-Frame-Options, Referrer-Policy,
Permissions-Policy, and the CSP from the example). The CSP is tuned for this site: it allows the Google
Fonts used by the landing page, the inline boot script SvelteKit emits, and the **Google Analytics**
endpoints (`googletagmanager.com`, `google-analytics.com`). Adjust the `root` path to your document root,
then save/reload nginx (CloudPanel does this for you).

> **If your site is already live:** re-apply the nginx config (or at least the updated CSP line) so Google
> Analytics can load — otherwise the CSP blocks it.

---

## 4. Cloudflare

1. **DNS:** in Cloudflare add the domain `monomap.app`.
   - `A` record: `monomap.app` → `79.125.166.165`, **Proxy status: Proxied** (orange cloud).
   - `CNAME` (or `A`): `www` → `monomap.app`, Proxied.
   - Wait for the "Active" status and that your origin IP shows as the proxy IP.
2. **SSL/TLS → Overview:** set the mode to **Full (strict)** for best security.
   - Because Cloudflare terminates TLS in front, nginx may stay on HTTP (port 80) behind Cloudflare.
   - For Full (strict), add an **origin certificate** in Cloudflare (SSL/TLS → Origin Server → Create
     Certificate) and install it in CloudPanel (CloudPanel can also issue a Let's Encrypt cert directly —
     either works; the origin needs a valid cert for "strict").
3. **SSL/TLS → Edge Certificates:** enable **Always Use HTTPS** and **Brotli** (Cloudflare serves the
   compressed version automatically).
4. **Caching:** leave defaults or set a Browser Cache TTL of ~1 month. Cloudflare automatically respects
   the `Cache-Control: immutable` on `/_app/`.
5. (Optional) **Page Rule / Cache Rule** to serve `index.html` for the root only — not required since the
   site is fully static.

---

## 5. Verify & index

- `https://monomap.app/` → landing page.
- `https://monomap.app/workspace` → the mind map (this is why the SPA fallback matters).
- `https://monomap.app/robots.txt` → allows `/`, blocks `/workspace`, points to the sitemap.
- `https://monomap.app/sitemap.xml` → lists the landing page.
- `https://monomap.app/og-image.png` → Open Graph image.

Then submit in **Google Search Console** (and Bing Webmaster Tools):
1. Add the property (domain) `monomap.app` — verify via DNS TXT record (Cloudflare makes this a one-click
   `_dmarc`/TXT copy).
2. **Sitemaps → submit** `https://monomap.app/sitemap.xml`.
3. Use the **URL Inspection** tool to request indexing of `https://monomap.app/`.

---

## Notes

- The app is **local-first**: everything (maps, profile) lives in the visitor's browser (IndexedDB). No
  backend, no cookies, no tracking — nothing to configure server-side.
- `robots.txt` blocks `/workspace` (the client-rendered shell) from being indexed, so search engines index the
  landing page only.
- To regenerate the Open Graph image after a brand change: `node scripts/og-image.mjs`.
