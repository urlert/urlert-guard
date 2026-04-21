<script lang="ts">
  import { cn } from "$lib/utils";
  import type { ThreatLevel } from "$lib/overlay-types";

  let {
    threatLevel,
    onclick,
  }: {
    threatLevel: ThreatLevel;
    onclick: () => void;
  } = $props();

  // Resolve extension asset URL directly — reliable in WXT content scripts
  const iconSrc = browser.runtime.getURL("/favicon.png");
</script>

<div
  class={cn(
    "icon-root",
    threatLevel === "danger" && "danger",
    threatLevel === "warn" && "warn",
    threatLevel === "safe" && "safe",
    threatLevel === "neutral" && "neutral",
  )}
  {onclick}
  title="URLert Guard — click for details"
  role="button"
  tabindex="0"
  onkeydown={(e) => e.key === "Enter" && onclick()}
>
  <img src={iconSrc} alt="URLert" class="icon-img" />

  {#if threatLevel === "danger"}
    <span class="dot danger-dot"></span>
  {:else if threatLevel === "warn"}
    <span class="dot warn-dot"></span>
  {:else if threatLevel === "safe"}
    <span class="dot safe-dot"></span>
  {/if}
</div>

<style>
  .icon-root {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #0f172a; /* Slate 900 */
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow:
      0 10px 25px -5px rgba(0, 0, 0, 0.4),
      0 8px 10px -6px rgba(0, 0, 0, 0.4),
      inset 0 1px 1px rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    cursor: pointer;
    transition:
      transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
      box-shadow 0.2s ease,
      background 0.2s ease,
      border-color 0.2s ease;
    animation: pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    overflow: visible;
    backdrop-filter: blur(8px);
  }

  .icon-root:hover {
    transform: scale(1.08) translateY(-2px);
    background: #1e293b; /* Slate 800 */
    box-shadow:
      0 20px 25px -5px rgba(0, 0, 0, 0.5),
      0 10px 10px -5px rgba(0, 0, 0, 0.3),
      inset 0 1px 1px rgba(255, 255, 255, 0.15);
  }

  .icon-root:active {
    transform: scale(0.96);
  }

  /* High Risk State */
  .danger {
    width: 88px;
    height: 88px;
    background: #450a0a; /* Red 950 */
    border-color: #ef4444; /* Red 500 */
    box-shadow:
      0 12px 30px -5px rgba(0, 0, 0, 0.5),
      0 0 0 3px rgba(239, 68, 68, 0.2);
    animation:
      pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
      pulse-danger-bg 2s infinite ease-in-out;
  }
  .danger:hover {
    background: #7f1d1d; /* Red 900 */
    box-shadow:
      0 20px 25px -5px rgba(0, 0, 0, 0.5),
      0 0 0 4px rgba(239, 68, 68, 0.3);
  }

  .danger .icon-img {
    width: 48px;
    height: 48px;
    border-radius: 10px;
  }

  .danger .dot {
    width: 20px;
    height: 20px;
    bottom: 6px;
    right: 6px;
  }

  /* Caution State */
  .warn {
    width: 68px;
    height: 68px;
    background: #422006; /* Amber 950 */
    border-color: #f59e0b; /* Amber 500 */
    box-shadow:
      0 10px 25px -5px rgba(0, 0, 0, 0.4),
      0 0 0 2px rgba(245, 158, 11, 0.15);
  }
  .warn:hover {
    background: #78350f; /* Amber 900 */
    box-shadow:
      0 20px 25px -5px rgba(0, 0, 0, 0.5),
      0 0 0 3px rgba(245, 158, 11, 0.2);
  }

  .warn .icon-img {
    width: 38px;
    height: 38px;
    border-radius: 8px;
  }

  .warn .dot {
    width: 16px;
    height: 16px;
    bottom: 4px;
    right: 4px;
  }

  .safe {
    border-color: hsl(160 84% 39% / 0.3);
  }

  .icon-img {
    width: 28px;
    height: 28px;
    object-fit: contain;
    border-radius: 6px;
    display: block;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  }

  .dot {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid #0f172a;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .dot.danger-dot {
    background: #ef4444;
    border-color: #450a0a;
    animation: pulse-danger-dot 1s infinite;
  }

  .dot.warn-dot {
    background: #f59e0b;
    border-color: #422006;
  }

  .dot.safe-dot {
    background: #10b981;
    border-color: #0f172a;
  }

  @keyframes pop-in {
    from {
      opacity: 0;
      transform: scale(0.5);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes pulse-danger-bg {
    0%,
    100% {
      border-color: #ef4444;
      box-shadow:
        0 12px 30px -5px rgba(0, 0, 0, 0.5),
        0 0 0 3px rgba(239, 68, 68, 0.2);
    }
    50% {
      border-color: #f87171; /* Brighter red for flashing border */
      box-shadow:
        0 12px 30px -5px rgba(0, 0, 0, 0.5),
        0 0 20px 6px rgba(239, 68, 68, 0.4);
    }
  }

  @keyframes pulse-danger-dot {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.25);
    }
  }
</style>
