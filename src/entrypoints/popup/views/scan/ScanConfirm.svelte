<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import {
    MonitorSmartphone,
    Code,
    ScanSearch,
    ShieldAlert,
  } from "@lucide/svelte";

  interface Props {
    domain: string;
    onsubmit: () => void;
    disabled?: boolean;
  }

  let { domain, onsubmit, disabled = false }: Props = $props();
</script>

<div class="flex flex-col gap-6">
  <Button
    variant="ghost"
    class="flex items-center justify-center gap-2 w-full h-11.5 rounded-lg text-sm font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/15 hover:text-indigo-300 transition-all group shadow-2xl"
    onclick={onsubmit}
    {disabled}
  >
    {disabled ? "Verification Required" : "Send for Analysis"}
    <ScanSearch
      class="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5"
    />
  </Button>

  <!-- What will be sent -->
  <div class="flex flex-col gap-3.5 px-0.5">
    <p class="text-xs font-semibold text-slate-500 uppercase tracking-widest">
      What will be sent to URLert.com:
    </p>
    <div class="flex items-center gap-3 text-[13.5px] text-slate-400">
      <div
        class="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0"
      >
        <MonitorSmartphone class="w-4 h-4 text-slate-500" />
      </div>
      <span>Screenshot of the visible page</span>
    </div>
    <div class="flex items-center gap-3 text-[13.5px] text-slate-400">
      <div
        class="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0"
      >
        <Code class="w-4 h-4 text-slate-500" />
      </div>
      <span>HTML content</span>
    </div>
  </div>

  <!-- Privacy & Security -->
  <div class="flex flex-col gap-3.5">
    <div
      class="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/[0.05] border border-amber-500/10"
    >
      <ShieldAlert class="w-4 h-4 text-amber-500/70 mt-0.5 shrink-0" />
      <p class="text-[13.5px] text-amber-200/60 leading-relaxed">
        For privacy reasons, avoid scanning pages with sensitive data such as
        personal or financial information.
      </p>
    </div>
  </div>
</div>
