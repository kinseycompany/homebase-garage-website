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
    return env.ASSETS.fetch(request);
  },
};
