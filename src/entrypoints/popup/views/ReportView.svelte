<script lang="ts">
  import { urlert } from "$lib/api";
  import type { ExtensionReportResponse } from "$lib/api";
  import type { ExtensionScanResult } from "$lib/scan";
  import { Spinner } from "$lib/components/ui/spinner";

  import { ArrowLeft, X } from "@lucide/svelte";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import ReportForm from "./report/ReportForm.svelte";
  import ReportSuccess from "./report/ReportSuccess.svelte";

  import { Button } from "$lib/components/ui/button";
  import { SendHorizonal } from "@lucide/svelte";

  interface Props {
    url: string;
    /** Pre-filled scan result (when reporting from scan) */
    scanResult?: ExtensionScanResult | null;
    /** Close / go back */
    onclose: () => void;
  }

  let { url, scanResult = null, onclose }: Props = $props();

  // ── State ───────────────────────────────────────────────────────────────────
  type ReportPhase = "form" | "submitting" | "success" | "error";
  let phase = $state<ReportPhase>("form");
  let errorMsg = $state<string | null>(null);
  let reportResponse = $state<ExtensionReportResponse | null>(null);

  let editableUrl = $state(url);
  let userComment = $state("");

  const canSubmit = $derived(
    editableUrl.trim().length > 0 &&
      (userComment.trim().length > 0 || scanResult !== null)
  );

  // ── Build markdown content from scan + user comment ─────────────────────────

  function buildContent(
    userComment: string,
    scan: ExtensionScanResult | null,
  ): string {
    const parts: string[] = [];

    if (scan) {
      parts.push("## Scan Results\n");

      const levelEmoji =
        scan.safety_level === "safe"
          ? "✅"
          : scan.safety_level === "caution"
            ? "⚠️"
            : "🚨";
      parts.push(
        `**Safety Level:** ${levelEmoji} ${scan.safety_level.charAt(0).toUpperCase() + scan.safety_level.slice(1)}`,
      );

      if (scan.summary) {
        parts.push(`\n**Summary:** ${scan.summary}`);
      }
      if (scan.brand_warning) {
        parts.push(`\n**Brand Warning:** ${scan.brand_warning}`);
      }
      if (scan.risks && scan.risks.length > 0) {
        parts.push(`\n**Risks:**`);
        for (const risk of scan.risks) parts.push(`- ${risk}`);
      }
      if (scan.tips && scan.tips.length > 0) {
        parts.push(`\n**Tips:**`);
        for (const tip of scan.tips) parts.push(`- ${tip}`);
      }
      if (scan.domain_registered_date) {
        parts.push(`\n**Domain Registered:** ${scan.domain_registered_date}`);
      }
    }

    if (userComment.trim()) {
      if (scan) {
        parts.push("\n---\n");
        parts.push("## User Comment\n");
      }
      parts.push(userComment.trim());
    }

    return parts.join("\n");
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    const content = buildContent(userComment, scanResult);
    if (!content.trim()) return;

    phase = "submitting";
    errorMsg = null;

    try {
      reportResponse = await urlert.submitReport({ url: editableUrl, content });
      phase = "success";
    } catch (err: any) {
      errorMsg = err?.message ?? "Failed to submit report";
      phase = "error";
    }
  }
</script>

<div
  class="flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-bottom-1 duration-250"
>
  {#if phase === "form" || phase === "error"}
    <!-- Fixed Action Header -->
    <div
      class="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/[0.04] bg-[#0a0c14] shrink-0 z-20"
    >
      <Tooltip.Root>
        <Tooltip.Trigger>
          <button
            onclick={onclose}
            class="group flex items-center gap-2.5 pl-1 pr-3.5 py-1.5 rounded-full text-[13px] font-semibold text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-all"
          >
            <div
              class="w-7 h-7 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center group-hover:border-white/[0.12] group-hover:bg-white/[0.06] transition-all"
            >
              <ArrowLeft class="w-3.5 h-3.5" />
            </div>
            Back
          </button>
        </Tooltip.Trigger>
        <Tooltip.Content side="top">
          Back to analysis
        </Tooltip.Content>
      </Tooltip.Root>

      <Tooltip.Root>
        <Tooltip.Trigger>
          <button
            onclick={onclose}
            class="w-8.5 h-8.5 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] transition-all border border-transparent hover:border-white/[0.08]"
            title="Dismiss"
          >
            <X class="w-4.5 h-4.5" />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Content side="top">
          Dismiss Report
        </Tooltip.Content>
      </Tooltip.Root>
    </div>
  {/if}

  <div
    class="flex-1 overflow-y-auto overflow-x-hidden p-5 scrollbar-thin scrollbar-thumb-white/8 scrollbar-track-transparent"
  >
    {#if phase === "form" || phase === "error"}
      {#key url}
        <ReportForm
          bind:editableUrl
          bind:userComment
          {scanResult}
          {onclose}
          {errorMsg}
        />
      {/key}
    {:else if phase === "submitting"}
      <div
        class="flex flex-col items-center justify-center text-center gap-3 py-10"
      >
        <Spinner class="w-7 h-7 text-amber-400" />
        <p class="text-sm text-slate-400 font-medium">Submitting report…</p>
      </div>
    {:else if phase === "success"}
      <ReportSuccess response={reportResponse} {onclose} />
    {/if}
  </div>

  {#if phase === "form" || phase === "error"}
    <div
      class="px-5 pb-5 pt-4 bg-[#0a0c14] shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.4)] flex flex-col gap-3 shrink-0 z-10"
    >
      <p class="text-[12px] text-slate-500 leading-relaxed text-center italic">
        This report will be <span class="text-amber-600/60 font-medium not-italic">shared publicly</span> on URLert discussion pages.
      </p>
      <Button
        variant="ghost"
        class="flex items-center justify-center gap-2 w-full h-11.5 rounded-lg text-sm font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 hover:text-amber-300 transition-all group shadow-2xl disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-white/[0.03] disabled:text-slate-600 disabled:border-white/[0.06] disabled:shadow-none"
        onclick={handleSubmit}
        disabled={!canSubmit}
      >
        Submit Report
        <SendHorizonal
          class="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5"
        />
      </Button>
    </div>
  {/if}
</div>
