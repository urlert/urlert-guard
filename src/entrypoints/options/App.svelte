<script lang="ts">
  import { onMount } from "svelte";
  import type { AuthState } from "$lib/auth";
  import * as Tabs from "$lib/components/ui/tabs";
  import {
    Settings,
    User,
    Keyboard,
    HelpCircle,
    ExternalLink,
  } from "@lucide/svelte";

  import SettingsView from "../popup/views/SettingsView.svelte";
  import AccountView from "../popup/views/AccountView.svelte";

  const AUTH_URL = import.meta.env.DEV
    ? "http://localhost:5173/extension/auth"
    : "https://www.urlert.com/extension/auth";

  let authState = $state<AuthState | null>(null);
  let authLoading = $state(true);
  let activeSection = $state("indicator");

  onMount(async () => {
    try {
      authState = await browser.runtime.sendMessage({ type: "GET_AUTH_STATE" });
    } catch {
      authState = null;
    } finally {
      authLoading = false;
    }
  });

  // Listen for auth state changes
  browser.storage.onChanged.addListener((changes) => {
    if (changes.urlertAuth) {
      authState = (changes.urlertAuth.newValue as AuthState) ?? null;
    }
  });

  function openSignIn() {
    browser.tabs.create({ url: AUTH_URL });
  }

  async function signOut() {
    await browser.runtime.sendMessage({ type: "URLERT_LOGOUT" });
    authState = null;
  }

  const navItems = [
    { value: "indicator", label: "Indicator", icon: Settings },
    { value: "account", label: "Account", icon: User },
    { value: "shortcuts", label: "Shortcuts", icon: Keyboard },
  ] as const;
</script>

<div class="min-h-screen bg-[#0a0c14] text-slate-200 antialiased flex flex-col">
  <!-- Header -->
  <header
    class="border-b border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent"
  >
    <div class="max-w-3xl mx-auto px-8 py-5 flex items-center gap-3">
      <img src="/favicon.png" alt="URLert Guard" class="h-8 object-contain" />
      <div class="flex flex-col">
        <span class="text-sm font-semibold text-slate-200 leading-tight"
          >URLert Guard</span
        >
        <span class="text-[11px] text-slate-500 leading-tight"
          >Extension settings</span
        >
      </div>
      <!-- <div class="flex-1"></div>
      <a
        href="https://www.urlert.com/extension"
        target="_blank"
        rel="noopener noreferrer"
        class="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/[0.08] hover:border-white/[0.10] transition-all cursor-pointer"
        title="Documentation"
      >
        <HelpCircle class="w-4 h-4" />
      </a> -->
    </div>
  </header>

  <!-- Content: sidebar + main -->
  <Tabs.Root
    bind:value={activeSection}
    orientation="vertical"
    class="flex-1 flex"
  >
    <div class="max-w-3xl mx-auto w-full flex flex-1">
      <!-- Sidebar -->
      <aside class="w-44 shrink-0 pr-6 border-r border-white/[0.04]">
        <Tabs.List
          class="flex flex-col gap-0.5 bg-transparent p-0 border-none pt-8 h-auto w-full items-stretch"
        >
          {#each navItems as item}
            <Tabs.Trigger
              value={item.value}
              class="flex w-full grow-0 basis-auto items-center justify-start gap-2.5 pr-3 py-2 h-auto text-[13px] font-medium text-slate-500 rounded-lg border-none bg-transparent shadow-none
                     data-[state=active]:text-slate-200 data-[state=active]:bg-white/[0.06] data-[state=active]:shadow-none
                     hover:text-slate-300 hover:bg-white/[0.03] transition-all duration-150"
            >
              <item.icon class="w-4 h-4 shrink-0" />
              {item.label}
            </Tabs.Trigger>
          {/each}
        </Tabs.List>

        <div class="mt-12">
          <div class="h-px bg-white/[0.04] mb-4 mx-2"></div>
          <a
            href="https://www.urlert.com/extension"
            target="_blank"
            rel="noopener noreferrer"
            class="flex w-full items-center justify-start gap-2.5 pr-3 py-2 text-[13px] font-medium text-slate-500 rounded-lg hover:text-slate-300 hover:bg-white/[0.03] transition-all duration-150"
          >
            <HelpCircle class="w-4 h-4 shrink-0" />
            Documentation
          </a>
        </div>
      </aside>

      <!-- Main content -->
      <main class="flex-1 w-full pb-6 pl-8 min-w-0">
        <Tabs.Content value="indicator">
          <h2 class="text-lg font-semibold text-slate-200 mb-6 pt-8">
            Security Indicator
          </h2>
          <div class="max-w-md">
            <SettingsView showShortcuts={false} />
          </div>
        </Tabs.Content>

        <Tabs.Content value="account">
          <h2 class="text-lg font-semibold text-slate-200 mb-6 pt-8">
            Account
          </h2>
          <div class="max-w-md">
            <AccountView {authState} {authLoading} {openSignIn} {signOut} />
          </div>
        </Tabs.Content>

        <Tabs.Content value="shortcuts">
          <h2 class="text-lg font-semibold text-slate-200 mb-6 pt-8">
            Keyboard Shortcuts
          </h2>
          <div class="max-w-md">
            <SettingsView showShortcuts={true} shortcutsOnly={true} />
          </div>
        </Tabs.Content>
      </main>
    </div>
  </Tabs.Root>

  <!-- Footer -->
  <footer class="border-t border-white/[0.04] py-4">
    <div class="max-w-3xl mx-auto px-8">
      <a
        href="https://www.urlert.com"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-400 transition-colors font-medium"
      >
        <img src="/favicon.png" alt="" class="w-3 h-3 opacity-50 rounded-sm" />
        urlert.com
        <ExternalLink class="w-2.5 h-2.5 opacity-50" />
      </a>
    </div>
  </footer>
</div>
