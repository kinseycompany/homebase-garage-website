# Homebase Garage — Website

Marketing site for Homebase personal warehouse garages.

**Production:** https://homebasegarage.com (Cloudflare Pages)
**Project:** `homebase-garage` (Cloudflare Pages, auto-deploys from `main`)

## Stack

- Static HTML/CSS/JS (no build step)
- Cloudflare Pages for hosting
- Cloudflare Pages Functions for the contact form (`functions/api/contact.js`)
- Resend for outbound email (free tier: 100/day, 3,000/mo)

## Contact form

`POST /api/contact` is handled by `functions/api/contact.js` and emails
`sales@homebasegarage.com` via the Resend API.

### Required environment variables (Cloudflare Pages → Settings → Environment variables)

| Variable          | Required | Notes                                                                                |
| ----------------- | -------- | ------------------------------------------------------------------------------------ |
| `RESEND_API_KEY`  | yes      | Mark as **encrypted/secret**. Generate at https://resend.com/api-keys                |
| `CONTACT_TO`      | no       | Defaults to `sales@homebasegarage.com`                                               |
| `CONTACT_FROM`    | no       | Defaults to `Homebase Website <onboarding@resend.dev>` (works without domain verify) |

Once `homebasegarage.com` is verified in Resend, set
`CONTACT_FROM="Homebase Website <noreply@homebasegarage.com>"` for proper
DKIM-signed deliverability.

## Local preview

```sh
python3 -m http.server 8421
# open http://127.0.0.1:8421
```

Pages Functions don't run under `python3 -m http.server` — to test the
contact form locally, use `npx wrangler pages dev .` instead.

## Deploy

Pushing to `main` triggers a Cloudflare Pages build automatically.
