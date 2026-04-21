export interface OverlaySettings {
  /** Show the overlay at all (master toggle) */
  overlayEnabled: boolean;
  /** Show overlay even for safe/unknown sites */
  showForSafeSites: boolean;
  /** Auto-dismiss timeout in seconds (0 = never auto-dismiss) */
  autoDismissSeconds: number;
  /** Position of the overlay */
  position: "top-right" | "bottom-right" | "top-left" | "bottom-left";
}

export const DEFAULT_SETTINGS: OverlaySettings = {
  overlayEnabled: true,
  showForSafeSites: false,
  autoDismissSeconds: 20,
  position: "bottom-right",
};

export async function getSettings(): Promise<OverlaySettings> {
  try {
    const keys = Object.keys(DEFAULT_SETTINGS);
    const stored = await browser.storage.sync.get(keys);
    // Merge defaults so any missing keys always have a value
    return { ...DEFAULT_SETTINGS, ...(stored as Partial<OverlaySettings>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(
  settings: Partial<OverlaySettings>,
): Promise<void> {
  await browser.storage.sync.set(settings);
}
