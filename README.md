# DQL Investigator

Interactive DQL (Dynatrace Query Language) learning app built with Next.js 14 + TypeScript + Tailwind CSS + Zustand + Supabase + Razorpay.

Domain: https://stackwise-ai.com

---

## Manual Deploy Steps (run one by one on the server)

SSH into the server and run each command. Do **not** run them all at once — verify each step before moving to the next.

### Prerequisites (one-time setup — already done)
- Node.js 20, nginx, certbot, pm2 are installed.
- `.env.production` exists at repo root with all secrets.
- Certbot SSL cert is already issued.

### Step-by-step deploy

**1. Enter the repo**
```bash
cd ~/dql-detective
```

**2. Pull latest dev code**
```bash
git fetch origin
git reset --hard origin/dev
```

**3. Install dependencies**
```bash
npm ci --prefer-offline
```

**4. Build the app**
```bash
NODE_ENV=production npm run build
```

**5. Load env vars into the shell**
```bash
set -a
source .env.production
set +a
```

**6. Stop and delete the old PM2 process**
```bash
pm2 delete dql-detective 2>/dev/null || true
```

**7. Start a fresh PM2 process**
```bash
pm2 start npm --name dql-detective -- start -- -p 3000
pm2 save
```

**8. Verify the app is responding on port 3000**
```bash
curl -s http://127.0.0.1:3000 | head -5
```
You should see `<!DOCTYPE html>` or `<html` in the output.

**9. Reload nginx**
```bash
systemctl reload nginx
```

**10. Verify from the public domain**
```bash
curl -sS https://stackwise-ai.com | head -5
```

Open `https://stackwise-ai.com` in your browser.

---

## Troubleshooting

### App shows "can't reach this page" / ERR_CONNECTION_REFUSED
1. Check if the app is running:
```bash
pm2 status
```
2. Check if port 3000 is listening:
```bash
ss -tlnp | grep 3000
```
3. Check nginx config:
```bash
nginx -t
```
4. Check firewall (Hetzner Cloud Console → Firewalls → allow TCP 80 and 443).

### Blank white page (app is running but nothing renders)
1. Check PM2 error logs:
```bash
pm2 logs dql-detective --lines 50
```
2. Open browser DevTools → Console and look for JavaScript errors.

### HTTPS not working but HTTP works
The SSL block in nginx may have been wiped. Re-run certbot to recreate it:
```bash
certbot --nginx --non-interactive --agree-tos --email technomonstert@gmail.com --redirect -d stackwise-ai.com -d www.stackwise-ai.com
systemctl reload nginx
```

### Server Action error: "Cannot read properties of undefined (reading 'workers')"
This happens when the build cache is stale or mismatched.
```bash
rm -rf .next
NODE_ENV=production npm run build
pm2 delete dql-detective 2>/dev/null || true
pm2 start npm --name dql-detective -- start -- -p 3000
pm2 save
```

---

## Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State:** Zustand (with localStorage persistence)
- **Auth:** Supabase Auth
- **Payments:** Razorpay (India only)
- **Deployment:** PM2 + nginx reverse proxy + Let's Encrypt SSL

---

## Local Dev

```bash
npm install
npm run dev
```

Open http://localhost:3000.
