<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { fade, slide } from "svelte/transition";
  import type { ThreatLevel } from "$lib/overlay-types";
  import type { OverlaySettings } from "$lib/settings";
  import { dismissDomain, DISMISS_DURATIONS } from "$lib/dismissal";
  import OverlayIcon from "./OverlayIcon.svelte";
  import { X } from "@lucide/svelte";

  let {
    threatLevel,
    settings,
  }: {
    threatLevel: ThreatLevel;
    settings: OverlaySettings;
  } = $props();

  let visible = $state(true);
  let hovered = $state(false);
  let showDismiss = $state(false);
  let dismissTimer: ReturnType<typeof setTimeout> | null = null;
  let hostElement: HTMLElement | null = $state(null);
  const domain = window.location.hostname;

  $effect(() => {
    if (showDismiss) {
      const handleGlobalClick = (e: MouseEvent) => {
        const path = e.composedPath();
        if (hostElement && !path.includes(hostElement)) {
          showDismiss = false;
        }
      };
      
      const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          showDismiss = false;
        }
      };

      window.addEventListener("mousedown", handleGlobalClick, true);
      window.addEventListener("keydown", handleKeydown, true);
      
      return () => {
        window.removeEventListener("mousedown", handleGlobalClick, true);
        window.removeEventListener("keydown", handleKeydown, true);
      };
    }
  });

  $effect(() => {
    if (!showDismiss && !hovered) {
      scheduleDismiss();
    } else {
      clearDismissTimer();
    }
  });

  function scheduleDismiss() {
    clearDismissTimer();
    if (settings.autoDismissSeconds > 0 && !hovered && !showDismiss) {
      dismissTimer = setTimeout(() => {
        visible = false;
      }, settings.autoDismissSeconds * 1000);
    }
  }

  function clearDismissTimer() {
    if (dismissTimer) {
      clearTimeout(dismissTimer);
      dismissTimer = null;
    }
  }

  function handleMouseEnter() {
    hovered = true;
  }
  function handleMouseLeave() {
    hovered = false;
  }

  function handleIconClick() {
    // Send message to background script to open the extension popup.
    browser.runtime.sendMessage({ type: "URLERT_OPEN_POPUP" }).catch(() => {
      console.log("URLert: popup open not supported");
    });
    visible = false;
  }

  async function handleMute(durationMs: number) {
    await dismissDomain(domain, durationMs);
    visible = false;
  }

  onDestroy(clearDismissTimer);
</script>

{#if visible}
  <div
    bind:this={hostElement}
    role="complementary"
    aria-label="URLert Guard security indicator"
    class="host"
    transition:fade={{ duration: 300 }}
    class:pos-top-right={settings.position === "top-right"}
    class:pos-top-left={settings.position === "top-left"}
    class:pos-bottom-right={settings.position === "bottom-right"}
    class:pos-bottom-left={settings.position === "bottom-left"}
    onmouseenter={handleMouseEnter}
    onmouseleave={handleMouseLeave}
  >
    <div class="overlay-container">
      <div class="icon-wrapper">
        <OverlayIcon {threatLevel} onclick={handleIconClick} />

        {#if hovered || showDismiss}
          <button
            class="dismiss-trigger"
            transition:fade={{ duration: 150 }}
            onclick={(e) => {
              e.stopPropagation();
              showDismiss = !showDismiss;
            }}
            title={showDismiss ? "Close menu" : "Dismiss options"}
          >
            <X size={10} />
          </button>
        {/if}
      </div>

      {#if showDismiss}
        <div 
          class="dismiss-menu" 
          transition:slide={{ axis: 'x', duration: 250 }}
        >
          <div class="menu-label">Dismiss for:</div>
          <div class="menu-options">
            <button onclick={(e) => { e.stopPropagation(); handleMute(DISMISS_DURATIONS.TEN_MINUTES); }}>10 mins</button>
            <button onclick={(e) => { e.stopPropagation(); handleMute(DISMISS_DURATIONS.ONE_DAY); }}>1 day</button>
            <button onclick={(e) => { e.stopPropagation(); handleMute(DISMISS_DURATIONS.THIRTY_DAYS); }}>30 days</button>
            <button onclick={(e) => { e.stopPropagation(); handleMute(DISMISS_DURATIONS.FOREVER); }}>Forever</button>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .host {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      sans-serif;
    color-scheme: light dark;
    position: fixed;
    z-index: 2147483647;
    pointer-events: auto;
  }

  .overlay-container {
    display: flex;
    align-items: center;
    position: relative;
    gap: 12px;
    transition: all 0.3s ease;
  }

  .pos-top-left .overlay-container,
  .pos-top-right .overlay-container {
    align-items: flex-start;
  }

  .pos-bottom-left .overlay-container,
  .pos-bottom-right .overlay-container {
    align-items: flex-end;
  }

  /* Directional logic: if on right side, menu grows left. If on left side, menu grows right. */
  .pos-top-right .overlay-container,
  .pos-bottom-right .overlay-container {
    flex-direction: row-reverse;
  }

  .pos-top-right {
    top: 20px;
    right: 20px;
  }
  .pos-top-left {
    top: 20px;
    left: 20px;
  }
  .pos-bottom-right {
    bottom: 20px;
    right: 20px;
  }
  .pos-bottom-left {
    bottom: 20px;
    left: 20px;
  }

  .icon-wrapper {
    position: relative;
    flex-shrink: 0;
  }

  .dismiss-trigger {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #94a3b8;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: blur(4px);
    padding: 0;
    z-index: 2147483647;
  }

  /* Adjust X position based on floating side to avoid being cut off */
  .pos-top-right .dismiss-trigger,
  .pos-bottom-right .dismiss-trigger {
    right: auto;
    left: -4px;
  }

  .dismiss-trigger:hover {
    background: #ef4444;
    color: white;
    border-color: #ef4444;
    transform: scale(1.1);
  }

  .dismiss-menu {
    background: #020617; /* Slate 950 for deep premium feel */
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 16px;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    box-shadow: 0 12px 30px -5px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05);
    white-space: nowrap;
    overflow: hidden;
    backdrop-filter: blur(12px);
  }

  .menu-label {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    color: #94a3b8; /* Slate 400 */
    letter-spacing: 0.06em;
  }

  .menu-options {
    display: flex;
    gap: 8px;
  }

  .menu-options button {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 9999px; /* Pill shape */
    padding: 4px 12px;
    color: #f8fafc; /* Slate 50 */
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .menu-options button:hover {
    background: #6366f1; /* Indigo 500 */
    color: white;
    border-color: #818cf8; /* Indigo 400 */
    transform: translateY(-1.5px);
    box-shadow: 0 4px 12px -2px rgba(99, 102, 241, 0.5);
  }

  .menu-options button:active {
    transform: translateY(0);
    filter: brightness(0.9);
  }
</style>
