import {
  registerClassificationListeners,
  handleClassificationMessage,
} from "./background/handlers/classification";
import { handleAuthMessage } from "./background/handlers/auth";
import { handleScanMessage } from "./background/handlers/scan";

export default defineBackground(() => {
  console.log("Urlert Guard background started");

  // Open onboarding page on first install.
  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
      browser.tabs.create({
        url: browser.runtime.getURL("/onboarding.html" as any),
      });
    }
  });

  // Register proactive tab-navigation listener.
  registerClassificationListeners();

  // Centralised message router — delegates to domain-specific handlers.
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Each handler returns `true` when it owns the message (async sendResponse).
    if (handleClassificationMessage(message, sender, sendResponse)) return true;
    if (handleAuthMessage(message, sender, sendResponse)) return true;
    if (handleScanMessage(message, sender, sendResponse)) return true;
  });

  // Keyboard shortcut commands.
  browser.commands.onCommand.addListener(async (command) => {
    if (command === "scan-current-page") {
      // Store a launch intent so the popup opens on the Scan tab.
      await browser.storage.local.set({ urlertLaunchIntent: "scan" });
      try {
        // openPopup() is available in Chrome 127+ / Firefox 127+.
        await (browser.action as any).openPopup();
      } catch {
        // If the popup is already visible or the API isn't supported,
        // the storage listener in the popup will still pick up the intent.
      }
    }
  });
});
