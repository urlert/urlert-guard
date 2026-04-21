<script lang="ts">
  import { onMount } from "svelte";
  import { 
    ShieldCheck, 
    Search, 
    Flag, 
    ExternalLink, 
    ShieldX,
    Info,
    TriangleAlert,
    CircleCheck,
    Puzzle,
    Lock
  } from "@lucide/svelte";
  import * as Card from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { Separator } from "$lib/components/ui/separator";
  import * as Kbd from "$lib/components/ui/kbd";
  import OverlayIcon from "@/entrypoints/content/OverlayIcon.svelte";
  import Overlay from "@/entrypoints/content/Overlay.svelte";
  import { getShortcuts, type ShortcutInfo } from "$lib/shortcuts";
  import { DEFAULT_SETTINGS } from "$lib/settings";

  const AUTH_URL = import.meta.env.DEV
    ? "http://localhost:5173/extension/auth"
    : "https://www.urlert.com/extension/auth";

  const DOCS_URL = "https://www.urlert.com/extension";
  const logoUrl = browser.runtime.getURL("/logo_dark_small.webp");

  let activeThreatLevel = $state<"danger" | "warn" | "safe" | "neutral">("danger");
  let mounted = $state(false);
  let shortcuts = $state<ShortcutInfo[]>([]);
  let showDemoOverlay = $state(false);

  const scanShortcut = $derived(shortcuts.find(s => s.name === "scan-current-page")?.keys || []);
  const openShortcut = $derived(shortcuts.find(s => s.name === "_execute_action")?.keys || []);

  onMount(async () => {
    mounted = true;
    shortcuts = await getShortcuts();
  });

  function triggerDemo() {
    showDemoOverlay = false;
    setTimeout(() => { showDemoOverlay = true; }, 10);
  }

  function openAuth() {
    browser.tabs.create({ url: AUTH_URL });
  }

  function openDocs() {
    browser.tabs.create({ url: DOCS_URL });
  }

  function openHome() {
    browser.tabs.create({ url: "https://www.urlert.com" });
  }

  function openSettings() {
    browser.runtime.openOptionsPage().catch(() => {
        browser.tabs.create({ url: "options.html" });
    });
  }
</script>

<div class="min-h-screen bg-background text-foreground p-6 md:p-12">
  <div class="max-w-4xl mx-auto space-y-8">
    {#if mounted}
      <header class="space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <img src={logoUrl} alt="URLert" class="h-14" />
            <Badge variant="secondary">v{browser.runtime.getManifest().version}</Badge>
          </div>
          
          <div class="flex items-center gap-4 px-6 py-3 rounded-full border-2 border-emerald-500/50 text-emerald-500 bg-emerald-500/10 font-black uppercase tracking-[0.1em] text-md">
            <CircleCheck class="w-10 h-10" />
            <span>URLert Guard is Active</span>
          </div>
        </div>
        <div class="space-y-3">
          <h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
            Welcome to URLert Guard
          </h1>
          <p class="text-xl text-muted-foreground max-w-2xl">
            Getting started with URLert Guard is simple. Here's how it works:
          </p>
        </div>
      </header>

      <div class="grid md:grid-cols-2 gap-6">
        <Card.Root>
          <Card.Header>
            <div class="flex items-center gap-2 mb-2">
              <ShieldCheck class="w-5 h-5 text-primary" />
              <Card.Title>Background Monitoring</Card.Title>
            </div>
            <Card.Description>Silent, real-time protection.</Card.Description>
          </Card.Header>
          <Card.Content>
            <div class="space-y-4">
              <p class="text-sm text-muted-foreground">
                URLert Guard works silently on every website you visit. It does not track your personal data or slow down your browsing.
                The extension only alerts you if you visit a site already flagged by our threat database or classified as high-risk by our analysis engine.
              </p>
            </div>
          </Card.Content>
        </Card.Root>

        <Card.Root>
          <Card.Header>
            <div class="flex items-center gap-2 mb-2">
              <Search class="w-5 h-5 text-primary" />
              <Card.Title>Manual Scanning</Card.Title>
            </div>
            <Card.Description>Verify any page instantly.</Card.Description>
          </Card.Header>
          <Card.Content>
            <div class="space-y-4">
              <p class="text-sm text-muted-foreground">
                To scan, open the extension and go to the Scan tab (or alternatively use the keyboard shortcut). If you are logged in, you will have a button to run a scan.
              </p>
              {#if scanShortcut.length > 0}
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-foreground">Scan shortcut:</span>
                  <Kbd.Group class="gap-1">
                    {#each scanShortcut as key, i}
                      {#if i > 0}<span class="text-xs text-muted-foreground">+</span>{/if}
                      <Kbd.Root class="text-xs">{key}</Kbd.Root>
                    {/each}
                  </Kbd.Group>
                </div>
              {/if}
            </div>
          </Card.Content>
        </Card.Root>
      </div>

      <Card.Root>
        <Card.Header>
          <Card.Title>Interpreting Indicators</Card.Title>
          <Card.Description>
            When a website is classified as risky, an overlay appears in the corner of your browser.
          </Card.Description>
        </Card.Header>
        <Card.Content class="grid md:grid-cols-2 gap-8">
          <div class="space-y-4">
            <div class="space-y-2">
              {#each [
                { id: 'danger', icon: ShieldX, label: 'High Risk (Red)', sub: 'Confirmed malicious domain or threat' },
                { id: 'warn', icon: TriangleAlert, label: 'Caution (Amber)', sub: 'Suspicious activity or low trust' },
                { id: 'safe', icon: ShieldCheck, label: 'No Known Risks (Green)', sub: 'No known risks, but run a scan in doubt' }
              ] as item}
                <button 
                  class="w-full flex items-center justify-between p-4 rounded-md border bg-card transition-colors hover:bg-accent hover:text-accent-foreground {activeThreatLevel === item.id ? 'border-primary ring-1 ring-primary' : ''}"
                  onclick={() => activeThreatLevel = item.id as any}
                >
                  <div class="flex items-center gap-4">
                    <item.icon class="w-5 h-5" />
                    <div class="text-left">
                      <div class="text-sm font-semibold">{item.label}</div>
                      <div class="text-xs text-muted-foreground">{item.sub}</div>
                    </div>
                  </div>
                </button>
              {/each}
            </div>
            <div class="flex items-start gap-2 p-4 rounded-md bg-muted text-sm text-foreground">
               <Info class="w-4 h-4 mt-0.5 shrink-0 text-primary" />
               <p class="text-muted-foreground">
                 No known risk (Green) indicators are disabled by default. You can enable them in <button onclick={openSettings} class="font-medium text-foreground underline underline-offset-4 hover:text-primary">Settings</button>.
               </p>
            </div>
          </div>

          <div class="rounded-md border bg-muted/50 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden group">
            <div class="scale-125 transition-all duration-300">
              {#key activeThreatLevel}
                <div>
                  <OverlayIcon threatLevel={activeThreatLevel} onclick={() => {}} />
                </div>
              {/key}
            </div>
            <Button 
              variant="default" 
              class="absolute bottom-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-xl"
              onclick={triggerDemo}
            >
              Test it now
            </Button>
            <span class="text-xs font-medium text-muted-foreground absolute bottom-4 uppercase tracking-wider group-hover:opacity-0 transition-opacity">Indicator Preview</span>
          </div>
        </Card.Content>
      </Card.Root>

      <div class="grid md:grid-cols-2 gap-6">
        <Card.Root>
          <Card.Header>
            <div class="flex items-center gap-2 mb-2">
              <Flag class="w-5 h-5 text-primary" />
              <Card.Title>Community Reporting</Card.Title>
            </div>
            <Card.Description>Help protect the community.</Card.Description>
          </Card.Header>
          <Card.Content>
            <div class="space-y-4">
              <p class="text-sm text-muted-foreground">
                If you encounter a site that is clearly malicious or suspicious, you can report it via the <strong>Flag icon</strong> in the extension popup. Every report is verified to help protect everyone in the community.
              </p>
              {#if openShortcut.length > 0}
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-foreground">Extension popup:</span>
                  <Kbd.Group class="gap-1">
                    {#each openShortcut as key, i}
                      {#if i > 0}<span class="text-xs text-muted-foreground">+</span>{/if}
                      <Kbd.Root class="text-xs">{key}</Kbd.Root>
                    {/each}
                  </Kbd.Group>
                </div>
              {/if}
            </div>
          </Card.Content>
        </Card.Root>

        <Card.Root>
          <Card.Header>
            <Card.Title>Account Integration</Card.Title>
            <Card.Description>Unlock additional features.</Card.Description>
          </Card.Header>
          <Card.Content>
            <p class="text-sm text-muted-foreground mb-6">
              Background protection is active automatically. We encourage you to create a free account to unlock manual scanning.
            </p>
            <div class="flex flex-col sm:flex-row gap-3">
              <Button onclick={openAuth} class="flex-1">
                Sign In / Register
                <ExternalLink class="w-4 h-4 ml-2" />
              </Button>
              <Button onclick={openDocs} variant="outline" class="flex-1">
                Documentation
                <ExternalLink class="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card.Content>
        </Card.Root>
      </div>

      <Separator />

      <footer class="flex items-center justify-between text-sm text-muted-foreground pb-8">
        <div class="flex items-center gap-6">
            <button onclick={openHome} class="hover:text-foreground">www.urlert.com</button>
            <button onclick={openSettings} class="hover:text-foreground">Settings</button>
        </div>
        <div>
            v{browser.runtime.getManifest().version}
        </div>
      </footer>
    {/if}
  </div>
</div>

{#if showDemoOverlay}
  <Overlay 
    threatLevel={activeThreatLevel} 
    settings={{...DEFAULT_SETTINGS, position: "bottom-right", autoDismissSeconds: 15}} 
  />
{/if}

