import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// OpenNext build for Cloudflare Workers.
// The defaults cover this app: static assets go through the `ASSETS` binding
// declared in wrangler.jsonc, the server runs on the Workers runtime with
// `nodejs_compat` (which is what the media routes rely on for node:crypto).
export default defineCloudflareConfig({});
