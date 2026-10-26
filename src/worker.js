// Worker entry: serves the static site and runs the contact form handler.
// The handler stays in functions/api/contact.js (Pages Functions format) so it is unchanged.
import { onRequestPost, onRequestOptions } from "../functions/api/contact.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/contact") {
      if (request.method === "POST") return onRequestPost({ request, env, ctx });
      if (request.method === "OPTIONS") return onRequestOptions({ request, env, ctx });
      return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST, OPTIONS" } });
    }
    // Serve the 404 page with a real 404 status if requested directly (avoids "soft 404" in Search Console)
    if (url.pathname === "/404" || url.pathname === "/404.html") {
      const page = await env.ASSETS.fetch(new Request(new URL("/404.html", url), request));
      return new Response(page.body, { status: 404, headers: page.headers });
    }
    // Strip trailing slashes from old Squarespace-style URLs so their redirects match
    if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.replace(/\/+$/, "");
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
