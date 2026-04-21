<script lang="ts">
  import type { OverlaySafetyContext } from "$lib/overlay-types";
  import { TriangleAlert, ChevronDown, ChevronUp } from "@lucide/svelte";
  import { cn } from "$lib/utils";

  let {
    safetyCtx,
  }: {
    safetyCtx: OverlaySafetyContext;
  } = $props();

  let expandedIdx = $state<number | null>(null);

  function toggle(i: number) {
    expandedIdx = expandedIdx === i ? null : i;
  }
</script>

{#if safetyCtx.risks.length > 0}
  <div class="space-y-2 pt-1">
    <p class="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
      Things to Know
    </p>

    <!-- Individual risk items – compact with expand -->
    {#each safetyCtx.risks as risk, i}
      <button
        type="button"
        class="w-full text-left flex items-start gap-2.5 text-sm p-2.5 rounded-lg border transition-colors hover:bg-white/[0.04] cursor-pointer {expandedIdx ===
        i
          ? 'bg-white/[0.04] border-white/[0.08]'
          : 'bg-white/[0.02] border-white/[0.04]'}"
        onclick={() => toggle(i)}
      >
        <TriangleAlert
          class={cn(
            "w-4 h-4 shrink-0 mt-0.5",
            safetyCtx.safetyLevel === "high-risk"
              ? "text-red-400"
              : "text-amber-500",
          )}
        />
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <span class="font-bold text-slate-200">{risk.label}</span>
            {#if expandedIdx === i}
              <ChevronUp class="w-3.5 h-3.5 text-slate-500 shrink-0" />
            {:else}
              <ChevronDown class="w-3.5 h-3.5 text-slate-500 shrink-0" />
            {/if}
          </div>
          {#if expandedIdx === i}
            <p
              class="text-[13px] text-slate-400 leading-relaxed mt-1.5 animate-in fade-in slide-in-from-top-1 duration-150"
            >
              {risk.description}
            </p>
          {/if}
        </div>
      </button>
    {/each}
  </div>
{/if}
