import { defineConfig } from "wxt";
import tailwind from "@tailwindcss/vite";
import path from "path";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-svelte"],
  manifest: {
    name: "URLert Guard",
    version: "0.0.7",
    author: {
      email: "admin@urlert.com",
    },
    homepage_url: "https://www.urlert.com",
    description:
      "Real-time protection from risky and malicious domains. URLert Guard uses proprietary threat intelligence to keep you safe.",
    permissions: ["tabs", "storage", "activeTab"],
    host_permissions: ["*://api.urlert.com/*"],
    commands: {
      _execute_action: {
        suggested_key: {
          default: "Alt+Shift+U",
        },
        description: "Open URLert Guard",
      },
      "scan-current-page": {
        suggested_key: {
          default: "Alt+Shift+S",
        },
        description: "Scan current page",
      },
    },
    web_accessible_resources: [
      {
        // Icons must be web-accessible so the content script overlay
        // can load them via browser.runtime.getURL() on third-party pages.
        resources: ["icon/*.png", "favicon.png"],
        matches: ["<all_urls>"],
      },
    ],
  },
  vite: () => ({
    plugins: [tailwind()],
    resolve: {
      alias: {
        $lib: path.resolve(__dirname, "./src/lib"),
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }),
});
