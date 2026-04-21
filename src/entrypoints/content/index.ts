import { mount, unmount } from "svelte";
import Overlay from "./Overlay.svelte";
import type { DomainClassification } from "$lib/api";
import {
  getSettings,
  DEFAULT_SETTINGS,
  type OverlaySettings,
} from "$lib/settings";
import { buildOverlaySafetyContext } from "$lib/overlay-types";

// How long to wait before retrying a domain that returned 404.
// Backend scan typically completes in ~30 s; we give it a bit of headroom.
const SCAN_RETRY_DELAY_MS = 35_000;

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",

  async main(ctx) {
    console.log("Urlert Guard content script loaded");

    let ui: ContentScriptUi<any> | null;
    let mounting: boolean = false;
    let overlay: any;
    let settings: OverlaySettings = { ...DEFAULT_SETTINGS };
    let scanRetryTimer: ReturnType<typeof setTimeout> | null = null;

    try {
      settings = await getSettings();
    } catch {
      // fall back to defaults
    }

    const renderUi = async (data: DomainClassification | null) => {
      if (!data) return;
      if (data.domain === "urlert.com") return;
      if (!settings.overlayEnabled) return;

      const safetyCtx = buildOverlaySafetyContext(data);
      if (safetyCtx.safetyLevel === "standard" && !settings.showForSafeSites)
        return;

      if (!ui && !mounting) {
        mounting = true;
        try {
          ui = await createShadowRootUi(ctx, {
            name: "urlert-guard-overlay",
            position: "inline",
            onMount: (container) => {
              console.log("Overlay mounted");
              overlay = mount(Overlay, {
                target: container,
                props: { threatLevel: safetyCtx.threatLevel, settings },
              });
              mounting = false;
            },
            onRemove: () => {
              if (overlay) {
                unmount(overlay);
                overlay = null;
              }
            },
          });

          ui.mount();
        } catch (error) {
          console.error("Failed to mount overlay:", error);
          mounting = false;
        }
      }
    };

    /**
     * Schedule a single retry for a domain that returned 404.
     * The content script is long-lived (unlike the MV3 service worker), so
     * the timer is reliable for the ~35 s scan window.
     */
    const scheduleRetry = () => {
      if (scanRetryTimer) return; // already scheduled
      scanRetryTimer = setTimeout(async () => {
        scanRetryTimer = null;
        try {
          const refreshed = await browser.runtime.sendMessage({
            type: "GET_CLASSIFICATION_REFRESH",
          });
          if (refreshed) renderUi(refreshed);
        } catch {
          // Tab may have navigated away — no-op
        }
      }, SCAN_RETRY_DELAY_MS);
    };

    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === "URLERT_CLASSIFICATION") {
        // Clear any pending retry — we now have the data we were waiting for.
        if (scanRetryTimer) {
          clearTimeout(scanRetryTimer);
          scanRetryTimer = null;
        }
        renderUi(message.payload);
      }

      if (message.type === "URLERT_SCANNING") {
        // Background confirmed a 404 → backend scan is in progress.
        scheduleRetry();
      }

      if (message.type === "URLERT_SETTINGS_CHANGED") {
        settings = { ...settings, ...message.payload };
      }

      // On-demand scan: background asks for the page HTML.
      if (message.type === "URLERT_GET_PAGE_HTML") {
        sendResponse({ html: document.documentElement.outerHTML });
        return true;
      }
    });

    // On first load, ask the background for the current classification.
    // If null is returned the domain is either being scanned or truly unknown;
    // schedule a retry either way (worst case: one extra call for unknown domains).
    try {
      const data = await browser.runtime.sendMessage({
        type: "GET_CLASSIFICATION",
      });
      if (data) {
        renderUi(data);
      } else {
        scheduleRetry();
      }
    } catch {
      // content script not ready or no classification yet
    }
  },
});
