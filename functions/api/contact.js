/**
 * POST /api/contact
 *
 * Cloudflare Pages Function. Receives the contact form, validates,
 * and forwards to sales@homebasegarage.com via Resend.
 *
 * Required env vars (set in CF dashboard or `wrangler pages secret put`):
 *   RESEND_API_KEY  - Resend API key (re_...)
 *   CONTACT_TO      - destination address (default: sales@homebasegarage.com)
 *   CONTACT_FROM    - verified sender, e.g. "Homebase Website <noreply@homebasegarage.com>"
 *                     (during testing, use "onboarding@resend.dev" until domain is verified)
 */

export async function onRequestPost({ request, env }) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  let payload;
  try {
    const ct = request.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      payload = await request.json();
    } else {
      const form = await request.formData();
      payload = Object.fromEntries(form);
    }
  } catch (_e) {
    return json({ error: "Invalid request body" }, 400, cors);
  }

  const name = sanitize(payload.name);
  const email = sanitize(payload.email);
  const phone = sanitize(payload.phone);
  const interest = sanitize(payload.interest);
  const message = sanitize(payload.message);
  const trap = sanitize(payload.website); // honeypot

  // Honeypot: silently drop bot submissions
  if (trap) return json({ ok: true }, 200, cors);

  if (!name || !email) {
    return json({ error: "Name and email are required." }, 400, cors);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Please provide a valid email address." }, 400, cors);
  }

  const to = env.CONTACT_TO || "sales@homebasegarage.com";
  const from = env.CONTACT_FROM || "Homebase Website <onboarding@resend.dev>";

  if (!env.RESEND_API_KEY) {
    return json({ error: "Email service not configured." }, 500, cors);
  }

  const subject = `New Homebase inquiry — ${name}${interest ? ` (${interest})` : ""}`;
  const text =
    `New contact form submission from homebasegarage.com\n\n` +
    `Name:     ${name}\n` +
    `Email:    ${email}\n` +
    `Phone:    ${phone || "(not provided)"}\n` +
    `Interest: ${interest || "(not provided)"}\n\n` +
    `Message:\n${message || "(none)"}\n`;

  const html =
    `<h2 style="font-family:system-ui,sans-serif;color:#2d3436">New Homebase inquiry</h2>` +
    `<table style="font-family:system-ui,sans-serif;border-collapse:collapse">` +
    row("Name", name) +
    row("Email", `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>`) +
    row("Phone", phone || "<em>not provided</em>") +
    row("Interest", interest || "<em>not provided</em>") +
    `</table>` +
    `<h3 style="font-family:system-ui,sans-serif;color:#2d3436;margin-top:24px">Message</h3>` +
    `<p style="font-family:system-ui,sans-serif;white-space:pre-wrap">${escapeHtml(message || "(none)")}</p>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: email,
      subject,
      text,
      html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("Resend failure", res.status, detail);
    return json({ error: "Could not send message. Please email us directly." }, 502, cors);
  }

  return json({ ok: true }, 200, cors);
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function json(obj, status, extra = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });
}

function sanitize(v) {
  if (v == null) return "";
  return String(v).trim().slice(0, 5000);
}

function row(label, val) {
  return (
    `<tr>` +
    `<td style="padding:6px 16px 6px 0;color:#636e72;vertical-align:top"><strong>${label}</strong></td>` +
    `<td style="padding:6px 0;color:#2d3436">${val}</td>` +
    `</tr>`
  );
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
