<script lang="ts">
  import { onMount } from "svelte";
  import { urlert, type SubscriptionResponse } from "$lib/api";
  import { ShieldCheck, MailWarning } from "@lucide/svelte";

  interface Props {
    subscription?: SubscriptionResponse | null;
    loading?: boolean;
    compact?: boolean;
  }

  let {
    subscription = $bindable(null),
    loading = $bindable(false),
    compact = false,
  }: Props = $props();

  onMount(async () => {
    if (!subscription && !loading) {
      loading = true;
      try {
        subscription = await urlert.getSubscription();
      } catch (e) {
        console.error("Failed to fetch subscription:", e);
      } finally {
        loading = false;
      }
    }
  });
</script>

{#if loading && !subscription}
  {#if !compact}
    <div class="flex items-center gap-2 py-2 text-sm text-slate-400">
      <div
        class="w-3.5 h-3.5 border border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin"
      ></div>
      Loading subscription...
    </div>
  {/if}
{:else if subscription}
  <div class={compact ? "" : "space-y-3 py-1"}>
    {#if !compact}
      <!-- Full View: Settings / Account Page -->
      <div class="flex items-center gap-3">
        <div
          class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0"
        >
          <ShieldCheck class="w-4 h-4 text-emerald-400" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-slate-200">
            {subscription.name || "Free Plan"}
          </p>
          {#if subscription.is_active}
            <p class="text-[13px] text-slate-400 mt-0.5">
              {subscription.daily_scan_limit} daily scans included
            </p>
          {/if}
        </div>
      </div>
    {/if}

    {#if !subscription.is_active}
      <div
        class="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 {compact
          ? 'mt-1'
          : 'mt-3'}"
      >
        <MailWarning class="w-4 h-4 text-amber-500/80 mt-0.5 shrink-0" />
        <div class="space-y-1">
          <p class="text-[13px] font-semibold text-amber-500/90">
            Email verification required
          </p>
          <p class="text-xs text-amber-500/70 leading-relaxed">
            {#if compact}
              Verify your email to enable daily scans.
            {:else}
              Please check your inbox and verify your email to activate your
              daily scan allowance and other features.
            {/if}
          </p>
        </div>
      </div>
    {/if}
  </div>
{:else if !loading && !compact}
  <p class="text-[13px] text-slate-400 py-2">
    Unable to load subscription details.
  </p>
{/if}
