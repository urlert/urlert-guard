<script lang="ts">
  import { onMount } from "svelte";
  import type { ExtensionScanResult } from "$lib/scan";
  import { cn } from "$lib/utils";
  import { Button } from "$lib/components/ui/button";
  import {
    ShieldCheck,
    ShieldAlert,
    TriangleAlert,
    CircleCheck,
    CalendarDays,
    Flag,
  } from "@lucide/svelte";

  interface Props {
    result: ExtensionScanResult;
  }

  let { result }: Props = $props();

  // Clear badge as soon as user sees the result
  onMount(() => {
    browser.action.setBadgeText({ text: "" });
  });

  const riskColor = $derived(
    result.safety_level === "safe"
      ? "text-emerald-400"
      : result.safety_level === "caution"
        ? "text-amber-400"
        : "text-red-400",
  );

  const riskBg = $derived(
    result.safety_level === "safe"
      ? "bg-emerald-500/10 border-emerald-500/20"
      : result.safety_level === "caution"
        ? "bg-amber-500/10 border-amber-500/20"
        : "bg-red-500/10 border-red-500/20",
  );

  const riskLabel = $derived(
    result.safety_level === "safe"
      ? "Looks Safe"
      : result.safety_level === "caution"
        ? "Caution"
        : "Dangerous",
  );

  /** Format ISO date string as "MMM D, YYYY" */
  function formatDate(iso: string): string {
    try {
      return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }
</script>

<div class="flex flex-col gap-4">
  <!-- Scanned URL -->
  <p
    class="text-[13px] text-slate-400 font-medium truncate px-0.5"
    title={result.request_url}
  >
    <span class="text-slate-500">Scanned:</span>
    <span class="text-slate-300">{result.request_url}</span>
  </p>

  <div class={cn("flex items-start gap-3.5 p-4 rounded-xl border", riskBg)}>
    <div
      class={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
        riskBg,
      )}
    >
      {#if result.safety_level === "safe"}
        <ShieldCheck class={cn("w-6 h-6", riskColor)} />
      {:else if result.safety_level === "caution"}
        <TriangleAlert class={cn("w-6 h-6", riskColor)} />
      {:else}
        <ShieldAlert class={cn("w-6 h-6", riskColor)} />
      {/if}
    </div>
    <div class="min-w-0 flex-1">
      <p class={cn("text-base font-semibold", riskColor)}>
        {riskLabel}
      </p>
      <p class="text-sm text-slate-400 mt-1.5 leading-relaxed">
        {result.summary}
      </p>
    </div>
  </div>

  {#if result.brand_warning}
    <div class="px-1">
      <p
        class="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-2"
      >
        Brand Warning
      </p>
      <p class="text-sm text-slate-400 leading-relaxed">
        {result.brand_warning}
      </p>
    </div>
  {/if}

  {#if result.risks && result.risks.length > 0}
    <div class="px-1">
      <p
        class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
      >
        Risks
      </p>
      <ul class="space-y-1">
        {#each result.risks as risk}
          <li class="text-sm text-slate-400 leading-relaxed flex gap-1.5">
            <span class="text-red-400 shrink-0">•</span>
            {risk}
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if result.tips && result.tips.length > 0}
    <div class="px-1">
      <p
        class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
      >
        Tips
      </p>
      <ul class="space-y-1">
        {#each result.tips as tip}
          <li class="text-sm text-slate-400 leading-relaxed flex gap-1.5">
            <span class="text-emerald-400 shrink-0">•</span>
            {tip}
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if result.domain_registered_date}
    <div class="flex items-center gap-2 px-1 text-sm text-slate-500">
      <CalendarDays class="w-3.5 h-3.5 shrink-0" />
      <span>
        Domain registered: <span class="text-slate-400">{formatDate(result.domain_registered_date)}</span>
      </span>
    </div>
  {/if}
</div>

