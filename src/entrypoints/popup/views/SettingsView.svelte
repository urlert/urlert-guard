<script lang="ts">
  import { onMount } from "svelte";
  import {
    getSettings,
    saveSettings,
    DEFAULT_SETTINGS,
    type OverlaySettings,
  } from "$lib/settings";
  import { getShortcuts, type ShortcutInfo } from "$lib/shortcuts";
  import { Button } from "$lib/components/ui/button";
  import * as Kbd from "$lib/components/ui/kbd";
  import {
    getDismissedDomains,
    undismissDomain,
  } from "$lib/dismissal";
  import {
    RotateCcw,
    Trash2,
  } from "@lucide/svelte";

  import SettingSection from "$lib/components/settings/SettingSection.svelte";
  import SettingToggle from "$lib/components/settings/SettingToggle.svelte";
  import SettingSelect from "$lib/components/settings/SettingSelect.svelte";

  interface Props {
    /** Show keyboard shortcuts section. Defaults to true. */
    showShortcuts?: boolean;
    /** Only render shortcuts (hide overlay/behaviour settings). */
    shortcutsOnly?: boolean;
  }

  let { showShortcuts = true, shortcutsOnly = false }: Props = $props();

  let settings = $state<OverlaySettings>({ ...DEFAULT_SETTINGS });
  let saved = $state(false);
  let shortcuts = $state<ShortcutInfo[]>([]);
  let dismissedDomains = $state<Record<string, number>>({});

  onMount(async () => {
    settings = await getSettings();
    shortcuts = await getShortcuts();
    dismissedDomains = await getDismissedDomains();
  });

  async function persist(patch: Partial<OverlaySettings>) {
    settings = { ...settings, ...patch };
    await saveSettings(patch);

    // Push live update to active tab's content script
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    for (const tab of tabs) {
      if (tab.id) {
        browser.tabs
          .sendMessage(tab.id, {
            type: "URLERT_SETTINGS_CHANGED",
            payload: patch,
          })
          .catch(() => {
            /* content script may not be present */
          });
      }
    }
    saved = true;
    setTimeout(() => (saved = false), 1500);
  }

  async function resetDefaults() {
    settings = { ...DEFAULT_SETTINGS };
    await saveSettings(DEFAULT_SETTINGS);
    saved = true;
    setTimeout(() => (saved = false), 1500);
  }

  async function handleRemoveDismissal(domain: string) {
    await undismissDomain(domain);
    dismissedDomains = await getDismissedDomains();
  }

  function formatExpiration(expiresAt: number) {
    if (expiresAt === 0) return "Forever";
    const date = new Date(expiresAt);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const dismissedList = $derived(
    Object.entries(dismissedDomains)
      .map(([domain, expiresAt]) => ({ domain, expiresAt }))
      .sort((a, b) => a.domain.localeCompare(b.domain))
  );

  // ── Select options ──────────────────────────────────────────────────────
  const dismissOptions = [
    { value: "0", label: "Never" },
    { value: "5", label: "5 seconds" },
    { value: "10", label: "10 seconds" },
    { value: "20", label: "20 seconds" },
    { value: "30", label: "30 seconds" },
  ];

  const positionOptions = [
    { value: "bottom-right", label: "Bottom right" },
    { value: "bottom-left", label: "Bottom left" },
    { value: "top-right", label: "Top right" },
    { value: "top-left", label: "Top left" },
  ];

  let dismissValue = $state(String(DEFAULT_SETTINGS.autoDismissSeconds));
  let positionValue = $state(DEFAULT_SETTINGS.position);

  // Keep local select state in sync when settings load
  $effect(() => {
    dismissValue = String(settings.autoDismissSeconds);
    positionValue = settings.position;
  });
</script>

<div class="space-y-4 animate-in fade-in duration-200">
  {#if !shortcutsOnly}
    <!-- Visibility toggles -->
    <SettingSection title="Visibility">
      <SettingToggle
        id="toggle-enabled"
        label="Show security indicator"
        description="Display the floating icon on scanned websites"
        checked={settings.overlayEnabled}
        onchange={(v) => persist({ overlayEnabled: v })}
      />

      <div class="h-px bg-white/[0.04] -mx-3"></div>

      <SettingToggle
        id="toggle-safe"
        label="Show on safe websites"
        description="By default, the indicator is hidden on trusted sites"
        checked={settings.showForSafeSites}
        disabled={!settings.overlayEnabled}
        onchange={(v) => persist({ showForSafeSites: v })}
      />
    </SettingSection>

    <!-- Interaction selects -->
    <SettingSection title="Interaction">
      <SettingSelect
        label="Hide automatically"
        description="Hide the indicator unless you hover over it"
        bind:value={dismissValue}
        disabled={!settings.overlayEnabled}
        options={dismissOptions}
        onchange={(v) => persist({ autoDismissSeconds: parseInt(v) })}
      />

      <div class="h-px bg-white/[0.04] -mx-3"></div>

      <SettingSelect
        label="Indicator position"
        description="Where the icon appears on your screen"
        bind:value={positionValue}
        disabled={!settings.overlayEnabled}
        options={positionOptions}
        onchange={(v) =>
          persist({ position: v as OverlaySettings["position"] })}
      />
    </SettingSection>

    <!-- Muted Websites -->
    {#if dismissedList.length > 0}
      <SettingSection title="Muted Websites">
        <div class="divide-y divide-white/[0.04] -mx-1">
          {#each dismissedList as { domain, expiresAt }}
            <div class="flex items-center justify-between py-3 px-1 group">
              <div class="flex flex-col gap-0.5">
                <span class="text-sm font-medium text-slate-200">{domain}</span>
                <span class="text-[11px] text-slate-500">
                  Expires: {formatExpiration(expiresAt)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                class="w-8 h-8 p-0 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all"
                onclick={() => handleRemoveDismissal(domain)}
                title="Remove dismissal"
              >
                <Trash2 class="w-4 h-4" />
              </Button>
            </div>
          {/each}
        </div>
      </SettingSection>
    {/if}

    <!-- Footer actions -->
    <div class="flex items-center justify-between pt-1">
      <Button
        variant="ghost"
        size="sm"
        class="text-sm gap-1.5 text-slate-400 hover:text-slate-300 px-2 h-8"
        onclick={resetDefaults}
      >
        <RotateCcw class="w-3.5 h-3.5" /> Reset to defaults
      </Button>
      {#if saved}
        <span
          class="text-[13px] text-emerald-400 font-medium animate-in fade-in duration-200"
        >
          ✓ Saved
        </span>
      {/if}
    </div>
  {/if}

  <!-- Keyboard shortcuts -->
  {#if showShortcuts && shortcuts.length > 0}
    <SettingSection title="Keyboard Shortcuts">
      <div class="divide-y divide-white/[0.04]">
        {#each shortcuts as s}
          <div class="flex items-center justify-between gap-4 py-2.5">
            <span class="text-sm font-medium text-slate-300"
              >{s.description}</span
            >
            {#if s.keys.length > 0}
              <Kbd.Group class="gap-1 shrink-0">
                {#each s.keys as key, i}
                  {#if i > 0}<span class="text-xs text-slate-600">+</span>{/if}
                  <Kbd.Root class="text-xs">{key}</Kbd.Root>
                {/each}
              </Kbd.Group>
            {:else}
              <span class="text-xs text-slate-600 italic">Not set</span>
            {/if}
          </div>
        {/each}
      </div>

      <p class="text-[13px] text-slate-400 leading-relaxed py-2">
        You can change these in your browser's extension shortcut settings.
      </p>
    </SettingSection>
  {/if}
</div>
