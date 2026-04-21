import { urlert } from "$lib/api";
import { getDomain } from "tldts";
import {
  isDomainDismissed,
  dismissDomain,
  DISMISS_DURATIONS,
} from "$lib/dismissal";

/**
 * Handles the tabs.onUpdated listener — classifies domains on navigation
 * and pushes results (or scanning state) to content scripts.
 */
export function registerClassificationListeners() {
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
      try {
        const url = new URL(tab.url);
        if (url.protocol.startsWith("http")) {
          const domain = url.hostname;

          if (await isDomainDismissed(domain)) {
            return;
          }

          const classification = await urlert.classifyDomain(domain);

          if (classification) {
            await browser.tabs
              .sendMessage(tabId, {
                type: "URLERT_CLASSIFICATION",
                payload: classification,
              })
              .catch(() => {
                console.log("Content script not ready for tab", tabId);
              });
          } else {
            await browser.tabs
              .sendMessage(tabId, {
                type: "URLERT_SCANNING",
                payload: { domain },
              })
              .catch(() => {
                console.log("Content script not ready for tab", tabId);
              });
          }
        }
      } catch (e) {
        console.error("Error in background listener:", e);
      }
    }
  });
}

/**
 * Handle classification-related messages from content scripts and the popup.
 * Returns `true` if the message was handled (async response), `false` otherwise.
 */
export function handleClassificationMessage(
  message: any,
  sender: Browser.runtime.MessageSender,
  sendResponse: (response?: any) => void,
): boolean {
  // Standard classification fetch (popup or content script on first load).
  if (message.type === "GET_CLASSIFICATION" && sender.tab?.url) {
    const url = new URL(sender.tab.url);
    const domain = url.hostname;
    isDomainDismissed(domain).then((isDismissed) => {
      if (isDismissed) {
        sendResponse(null);
      } else {
        urlert.classifyDomain(domain).then(sendResponse);
      }
    });
    return true;
  }

  // Content script retry after the backend scan window (~35 s).
  if (message.type === "GET_CLASSIFICATION_REFRESH" && sender.tab?.url) {
    const url = new URL(sender.tab.url);
    const domain = url.hostname;
    isDomainDismissed(domain).then((isDismissed) => {
      if (isDismissed) {
        sendResponse(null);
      } else {
        urlert.forceRefreshClassification(domain).then(sendResponse);
      }
    });
    return true;
  }

  // Content script icon was clicked → open the extension popup.
  if (message.type === "URLERT_OPEN_POPUP") {
    browser.storage.local.set({ urlertLaunchIntent: "domain" }).then(() => {
      browser.action.openPopup().catch(() => {
        console.log("URLert: browser.action.openPopup() not supported");
      });
    });
    return false;
  }

  return false;
}
