<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import type { AuthState } from "$lib/auth";
  import type {
    ActiveScan,
    ScanStatusResponse,
    ExtensionScanResult,
    ScanHistoryItem,
  } from "$lib/scan";

  import ScanAuthGate from "./scan/ScanAuthGate.svelte";
  import ScanConfirm from "./scan/ScanConfirm.svelte";
  import ScanProgress from "./scan/ScanProgress.svelte";
  import ScanResult from "./scan/ScanResult.svelte";
  import ScanError from "./scan/ScanError.svelte";
  import ScanHistory from "./scan/ScanHistory.svelte";
  import ReportView from "./ReportView.svelte";
  import SubscriptionStatus from "$lib/components/settings/SubscriptionStatus.svelte";
  import { Button } from "$lib/components/ui/button";
  import { Flag, X } from "@lucide/svelte";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import type { SubscriptionResponse } from "$lib/api";

  interface Props {
    url: string;
    domain: string;
    tabId: number;
    screenshot?: string | null;
    authState: AuthState | null;
    openSignIn: () => void;
    focusJobId?: string | null;
    onFocusConsumed?: () => void;
  }

  let {
    url,
    domain,
    tabId,
    screenshot,
    authState,
    openSignIn,
    focusJobId,
    onFocusConsumed,
  }: Props = $props();

  let subscription = $state<SubscriptionResponse | null>(null);
  let subLoading = $state(false);

  // ── State machine ──────────────────────────────────────────────────────────
  type ScanPhase =
    | "idle"
    | "submitting"
    | "polling"
    | "completed"
    | "failed"
    | "reporting";

  let phase = $state<ScanPhase>("idle");
  let jobId = $state<string | null>(null);
  let result = $state<ExtensionScanResult | null>(null);
  let errorMsg = $state<string | null>(null);
  let errorStatus = $state<number | null>(null);
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let elapsedSeconds = $state(0);
  let elapsedTimer: ReturnType<typeof setInterval> | null = null;
  let historyKey = $state(0);

  const POLL_INTERVAL_MS = 4_000;
  const MAX_POLL_DURATION_MS = 5 * 60 * 1000;

  onMount(async () => {
    try {
      const active: ActiveScan | null = await browser.runtime.sendMessage({
        type: "URLERT_GET_ACTIVE_SCAN",
      });

      if (active && active.url === url) {
        jobId = active.job_id;
        if (active.status === "complete" && active.result) {
          result = active.result;
          phase = "completed";
        } else if (active.status === "failed") {
          errorMsg = active.error ?? "Scan failed";
          phase = "failed";
        } else {
          phase = "polling";
          startPolling();
        }
      }
    } catch {}
  });

  onDestroy(() => stopPolling());

  async function submitScan() {
    phase = "submitting";
    errorMsg = null;
    try {
      const response = await browser.runtime.sendMessage({
        type: "URLERT_SCAN_REQUEST",
        payload: { url, tabId, screenshot: screenshot ?? undefined },
      });
      if (!response?.success) {
        const error = new Error(response?.error ?? "Failed to submit scan");
        (error as any).status = response?.status;
        throw error;
      }
      jobId = response.job_id;
      phase = "polling";
      startPolling();
    } catch (err: any) {
      errorMsg = err?.message ?? "Failed to submit scan";
      errorStatus = err?.status ?? null;
      phase = "failed";
    }
  }

  function startPolling() {
    elapsedSeconds = 0;
    elapsedTimer = setInterval(() => {
      elapsedSeconds += 1;
    }, 1000);
    pollTimer = setInterval(async () => {
      if (!jobId) return;
      if (elapsedSeconds * 1000 > MAX_POLL_DURATION_MS) {
        errorMsg = "Scan timed out. Please try again later.";
        phase = "failed";
        stopPolling();
        return;
      }
      try {
        const status: ScanStatusResponse = await browser.runtime.sendMessage({
          type: "URLERT_SCAN_STATUS",
          payload: { job_id: jobId },
        });
        if (status.status === "complete" && status.result) {
          result = status.result;
          phase = "completed";
          stopPolling();
        } else if (status.status === "failed") {
          errorMsg = status.error ?? "Scan failed on the server";
          phase = "failed";
          stopPolling();
        }
      } catch {}
    }, POLL_INTERVAL_MS);
  }

  $effect(() => {
    if (focusJobId) {
      loadSpecificJob(focusJobId);
    }
  });

  async function loadSpecificJob(id: string) {
    try {
      const active = await browser.runtime.sendMessage({
        type: "URLERT_GET_ACTIVE_SCAN",
      });
      if (active && active.job_id === id) {
        jobId = active.job_id;
        if (active.status === "complete" && active.result) {
          result = active.result;
          phase = "completed";
        } else if (active.status === "failed") {
          errorMsg = active.error ?? "Scan failed";
          phase = "failed";
        } else {
          phase = "polling";
          startPolling();
        }
        onFocusConsumed?.();
        return;
      }
      const history = await browser.runtime.sendMessage({
        type: "URLERT_GET_SCAN_HISTORY",
      });
      const item = (history as ScanHistoryItem[]).find((h) => h.job_id === id);
      if (item) {
        viewHistoricalResult(item);
        onFocusConsumed?.();
        return;
      }
    } catch (e) {
      console.error("Failed to load specific job", e);
    }
  }

  function stopPolling() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    if (elapsedTimer) { clearInterval(elapsedTimer); elapsedTimer = null; }
  }

  async function dismiss() {
    await browser.runtime.sendMessage({ type: "URLERT_CLEAR_ACTIVE_SCAN" });
    phase = "idle";
    jobId = null;
    result = null;
    errorMsg = null;
    errorStatus = null;
    historyKey += 1;
  }

  function viewHistoricalResult(item: ScanHistoryItem) {
    result = item.result;
    phase = "completed";
    jobId = null;
  }

  function openReport() { phase = "reporting"; }

  function closeReport() {
    if (result) phase = "completed";
    else phase = "idle";
  }

  const showHistory = $derived(!!authState && (phase === "idle" || phase === "failed"));
</script>

<div class="flex flex-col h-full min-h-0 overflow-hidden animate-in fade-in slide-in-from-bottom-1 duration-250">
  {#if phase === "reporting"}
    <ReportView {url} scanResult={result} onclose={closeReport} />
  {:else}
    {#if phase === "completed" && result}
      <!-- Fixed Action Header -->
      <div class="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/[0.04] bg-[#0a0c14] shrink-0 z-20">
        <span class="text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] pl-0.5">Analysis Result</span>
        <div class="flex items-center gap-1.5">
          <Tooltip.Root>
            <Tooltip.Trigger>
              <button
                onclick={openReport}
                class="w-8.5 h-8.5 rounded-full flex items-center justify-center text-slate-500 hover:text-amber-500/80 hover:bg-amber-500/5 transition-all border border-transparent hover:border-amber-500/20"
              >
                <Flag class="w-4 h-4" />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content
              side="bottom"
              class="bg-slate-900 text-white text-[11px] py-1 px-2.5 rounded border border-white/10 shadow-3xl text-balance"
            >
              Report URL
            </Tooltip.Content>
          </Tooltip.Root>

          <Tooltip.Root>
            <Tooltip.Trigger>
              <button
                onclick={dismiss}
                class="w-8.5 h-8.5 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-all border border-transparent hover:border-white/[0.08]"
              >
                <X class="w-4.5 h-4.5" />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content side="bottom">
              Dismiss Result
            </Tooltip.Content>
          </Tooltip.Root>
        </div>
      </div>
    {/if}

    <div class="flex-1 overflow-y-auto overflow-x-hidden p-5 scrollbar-thin scrollbar-thumb-white/8 scrollbar-track-transparent">
      {#if !authState}
        <ScanAuthGate {openSignIn} />
      {:else}
        {#if phase === "idle"}
          <SubscriptionStatus bind:subscription bind:loading={subLoading} compact={true} />
          <ScanConfirm {domain} onsubmit={submitScan} disabled={subscription !== null && !subscription.is_active} />
        {:else if phase === "submitting" || phase === "polling"}
          <ScanProgress {phase} {domain} {elapsedSeconds} />
        {:else if phase === "completed" && result}
          <ScanResult {result} />
        {:else if phase === "failed"}
          <ScanError {errorMsg} status={errorStatus} ondismiss={dismiss} onretry={submitScan} />
        {/if}
      {/if}

      {#if showHistory}
        <div class="mt-2 text-left">
          <div class="h-px bg-white/[0.05] mb-3"></div>
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 px-0.5">Recent Scans</p>
          {#key historyKey}
            <ScanHistory onview={viewHistoricalResult} />
          {/key}
        </div>
      {/if}
    </div>
  {/if}
</div>
