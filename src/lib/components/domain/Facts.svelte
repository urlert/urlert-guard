<script lang="ts">
  import type { DomainClassification } from "$lib/api";
  import { Building2, TrendingUp, Calendar } from "@lucide/svelte";

  let {
    classification,
  }: {
    classification: DomainClassification;
  } = $props();

  // Format purpose slug for display (e.g. "file_storage" → "File Storage")
  function formatPurpose(slug: string): string {
    return slug
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  /**
   * Traffic badge based on Tranco rank (matches urlert.com levels).
   */
  function getTrafficLabel(rank: number | null | undefined): { label: string; color: string } {
    if (!rank) return { label: "Unranked", color: "text-slate-500" };
    if (rank <= 10_000) return { label: "Very High Traffic", color: "text-emerald-400" };
    if (rank <= 100_000) return { label: "High Traffic", color: "text-emerald-400" };
    if (rank <= 500_000) return { label: "Moderate Traffic", color: "text-sky-400" };
    if (rank <= 3_000_000) return { label: "Some Traffic", color: "text-slate-300" };
    if (rank <= 10_000_000) return { label: "Low Traffic", color: "text-slate-400" };
    return { label: "Minimal Traffic", color: "text-slate-500" };
  }

  /**
   * Format registration date for display.
   * For domains < 1 year old, show granular age + exact date.
   * For older domains, just shows the date.
   */
  function formatRegistrationInfo(dateStr: string): { age: string | null; date: string } {
    const created = new Date(dateStr);
    if (isNaN(created.getTime())) return { age: null, date: "Unknown" };

    const date = created.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const diffMs = Date.now() - created.getTime();
    if (diffMs < 0) return { age: null, date };

    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    // Only show granular age for domains < 1 year
    if (diffDays < 30) {
      return { age: `${diffDays} day${diffDays === 1 ? "" : "s"} ago`, date };
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return { age: `${months} month${months === 1 ? "" : "s"} ago`, date };
    }

    return { age: null, date };
  }

  const rank = $derived(classification.facts?.rank);
  const traffic = $derived(getTrafficLabel(rank));
  const regInfo = $derived(
    classification.facts?.registered_date
      ? formatRegistrationInfo(classification.facts.registered_date)
      : null,
  );

  // Show section if we have anything to display
  const hasContent = $derived(
    classification.category?.specialization ||
    classification.category?.purpose ||
    classification.facts?.hosting_provider ||
    rank !== undefined ||
    regInfo,
  );
</script>

{#if hasContent}
  <div class="space-y-1.5 pt-1">
    {#if rank}
      <div class="flex items-start justify-between gap-3 text-sm">
        <span class="text-slate-400 flex items-center gap-1.5 shrink-0 pt-0.5"
          ><TrendingUp class="w-3.5 h-3.5" /> Traffic</span
        >
        <span class="font-medium text-right {traffic.color}"
          >{traffic.label}
          <span class="text-slate-500 text-xs">#{rank.toLocaleString()}</span>
        </span>
      </div>
    {/if}
    {#if regInfo}
      <div class="flex items-start justify-between gap-3 text-sm">
        <span class="text-slate-400 flex items-center gap-1.5 shrink-0 pt-0.5"
          ><Calendar class="w-3.5 h-3.5" /> Registered</span
        >
        <span class="font-medium text-slate-300 text-right">
          {#if regInfo.age}
            <span class="text-amber-400">{regInfo.age}</span>
            <span class="text-slate-500 text-xs">({regInfo.date})</span>
          {:else}
            {regInfo.date}
          {/if}
        </span>
      </div>
    {/if}
    {#if classification.category?.specialization}
      <div class="flex items-start justify-between gap-3 text-sm">
        <span class="text-slate-400 shrink-0 pt-0.5">Category</span>
        <span class="font-medium text-slate-300 text-right break-words"
          >{classification.category.specialization}</span
        >
      </div>
    {:else if classification.category?.purpose}
      <div class="flex items-start justify-between gap-3 text-sm">
        <span class="text-slate-400 shrink-0 pt-0.5">Category</span>
        <span class="font-medium text-slate-300 text-right break-words"
          >{formatPurpose(classification.category.purpose)}</span
        >
      </div>
    {/if}
    {#if classification.facts?.hosting_provider}
      <div class="flex items-start justify-between gap-3 text-sm">
        <span class="text-slate-400 flex items-center gap-1.5 shrink-0 pt-0.5"
          ><Building2 class="w-3.5 h-3.5" /> Hosting</span
        >
        <span class="font-medium text-slate-300 text-right break-words"
          >{classification.facts.hosting_provider}</span
        >
      </div>
    {/if}
  </div>
{/if}
