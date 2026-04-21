<script lang="ts">
  import type { OverlaySafetyContext } from "$lib/overlay-types";
  import { Badge } from "$lib/components/ui/badge";
  import {
    TriangleAlert,
    ShieldAlert,
    CheckCircle,
    Circle,
    AlertCircle,
  } from "@lucide/svelte";
  import { cn } from "$lib/utils";

  let {
    safetyCtx,
  }: {
    safetyCtx: OverlaySafetyContext;
  } = $props();

</script>

<div class="space-y-2.5">
  {#if safetyCtx.safetyLevel === "high-risk"}
    <!-- High-Risk -->
    <div class="flex items-start gap-2.5">
      <div class="shrink-0 pt-0.5">
        <Badge
          variant="destructive"
          class="text-xs px-2.5 py-1 h-7 font-black gap-1.5 uppercase tracking-wide"
        >
          <ShieldAlert class="w-3.5 h-3.5" />
          High Risk
        </Badge>
      </div>
      <div class="min-w-0">
        <p class="text-sm font-bold text-red-300 leading-snug">{safetyCtx.safetyLabel}</p>
        <p class="text-[13px] leading-relaxed pt-0.5 text-red-300/70">
          {safetyCtx.trustSummary}
        </p>
      </div>
    </div>
  {:else if safetyCtx.safetyLevel === "caution"}
    <!-- Caution -->
    <div class="flex items-start gap-2.5">
      <div class="shrink-0 pt-0.5">
        <Badge
          class="text-xs px-2.5 py-1 h-7 font-black gap-1.5 uppercase tracking-wide bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20"
        >
          <TriangleAlert class="w-3.5 h-3.5" />
          Caution
        </Badge>
      </div>
      <div class="min-w-0">
        <p class="text-sm font-bold text-amber-300 leading-snug">{safetyCtx.safetyLabel}</p>
        <p class="text-[13px] leading-relaxed pt-0.5 text-amber-300/70">
          {safetyCtx.trustSummary}
        </p>
      </div>
    </div>
  {:else}
    <!-- Standard — no badge, just factual summary -->
    <p class="text-[13px] leading-relaxed text-slate-400">
      {safetyCtx.trustSummary}
    </p>
  {/if}

  <!-- Trust evidence (compact) -->
  {#if safetyCtx.trustSignals.length > 0}
    <div class="flex flex-wrap gap-x-3 gap-y-1 pl-0.5">
      {#each safetyCtx.trustSignals as signal}
        <div class="flex items-center gap-1">
          {#if signal.sentiment === "positive"}
            <CheckCircle class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          {:else if signal.sentiment === "warning"}
            <AlertCircle class="w-3.5 h-3.5 text-amber-500 shrink-0" />
          {:else}
            <Circle class="w-3.5 h-3.5 text-slate-500 shrink-0" />
          {/if}
          <span
            class={cn(
              "text-[13px]",
              signal.sentiment === "positive" && "text-slate-300",
              signal.sentiment === "warning" && "text-amber-400",
              signal.sentiment === "neutral" && "text-slate-400",
            )}>{signal.text}</span
          >
        </div>
      {/each}
    </div>
  {/if}
</div>
