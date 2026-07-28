# OPSLOG — deploying to GitHub Pages

Six files, no build step needed:

- `index.html` — the app (per-entry date + time picker; registers the service worker)
- `manifest.json` — web app manifest, correct PNG icon sizes for installability
- `icon.svg` — vector icon (used as a fallback / browser tab icon)
- `icon-192.png`, `icon-512.png` — the icons the manifest actually points to for install/home-screen
- `sw.js` — service worker: caches the app shell for offline use, and auto-syncs whenever you push new files to the repo

## Steps

1. Create a new repository on GitHub (e.g. `opslog`) — or reuse `Systemadmin1`.
2. Add all six files to the repo root.
3. Commit and push:
   ```bash
   git init
   git add index.html manifest.json icon.svg icon-192.png icon-512.png sw.js
   git commit -m "Add OPSLOG with offline support"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
4. On GitHub: **Settings → Pages → Source** → select the `main` branch, `/ (root)` folder → **Save**.
5. Live at `https://<your-username>.github.io/<your-repo>/` within a minute or two.

## How the auto-sync works

- `sw.js` uses a stale-while-revalidate strategy: it serves the app instantly from cache, then fetches the live version from the repo in the background and updates the cache.
- While a tab is open, it checks for a new `sw.js` every 60 seconds.
- When it detects an updated app shell, a small "A newer version is available — Refresh" banner appears at the bottom of the screen. Tapping it activates the new version and reloads.
- To force every visitor to get a hard refresh (e.g. after a major change), bump `CACHE_VERSION` at the top of `sw.js` before pushing — that invalidates all old caches.

## Notes

- Data is stored privately per user through the app's storage layer — nothing to configure.
- If your existing GitHub Pages site still doesn't show the manifest after pushing, do a hard refresh (Ctrl/Cmd+Shift+R) — the *old* service worker (if one was already running) needs to fetch and activate the new one first.
