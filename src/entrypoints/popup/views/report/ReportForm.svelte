<script lang="ts">
  import type { ExtensionScanResult } from "$lib/scan";
  import { Button } from "$lib/components/ui/button";
  import {
    SendHorizonal,
    ArrowLeft,
    AlertTriangle,
    Globe,
    X,
  } from "@lucide/svelte";

  interface Props {
    editableUrl: string;
    userComment: string;
    scanResult?: ExtensionScanResult | null;
    onclose: () => void;
    errorMsg?: string | null;
  }

  let {
    editableUrl = $bindable(),
    userComment = $bindable(),
    scanResult = null,
    onclose,
    errorMsg = null,
  }: Props = $props();

</script>



<!-- URL field -->
<div class="flex flex-col gap-1.5 px-0.5 mt-4">
  <label
    for="report-url"
    class="text-xs font-semibold text-slate-400 uppercase tracking-wider"
    >URL</label
  >
  <div class="relative">
    <Globe
      class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600"
    />
    <input
      id="report-url"
      type="url"
      bind:value={editableUrl}
      class="w-full pl-8 pr-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/30 focus:bg-white/[0.06] transition-all"
      placeholder="https://example.com"
    />
  </div>
</div>

<!-- Scan context (if from scan) -->
{#if scanResult}
  <div class="flex flex-col gap-1.5 px-0.5 mt-4">
    <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
      Scan Data Included
    </p>
    <div
      class="p-3.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-slate-400 leading-relaxed"
    >
      <div class="flex items-center gap-2 mb-1.5">
        <span
          class="text-xs font-semibold px-1.5 py-0.5 rounded {scanResult.safety_level ===
          'safe'
            ? 'bg-emerald-500/15 text-emerald-400'
            : scanResult.safety_level === 'caution'
              ? 'bg-amber-500/15 text-amber-400'
              : 'bg-red-500/15 text-red-400'}"
        >
          {scanResult.safety_level.toUpperCase()}
        </span>
      </div>
      <p class="line-clamp-2">{scanResult.summary}</p>
      {#if scanResult.risks && scanResult.risks.length > 0}
        <p class="mt-1 text-slate-400">
          + {scanResult.risks.length} risk{scanResult.risks.length > 1
            ? "s"
            : ""} identified
        </p>
      {/if}
    </div>
  </div>
{/if}

<!-- User comment -->
<div class="flex flex-col gap-1.5 px-0.5 mt-4">
  <label
    for="report-comment"
    class="text-xs font-semibold text-slate-400 uppercase tracking-wider"
  >
    {scanResult ? "Additional Comments" : "Description"}
    {#if !scanResult}
      <span class="text-red-400">*</span>
    {/if}
  </label>
  <textarea
    id="report-comment"
    bind:value={userComment}
    rows="3"
    class="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/30 focus:bg-white/[0.06] transition-all resize-none leading-relaxed"
    placeholder={scanResult
      ? "Add any additional details about why you believe this is a threat…"
      : "Describe why you believe this URL is malicious or suspicious…"}
  ></textarea>
</div>


<!-- Error message -->
{#if errorMsg}
  <div
    class="flex items-start gap-2.5 p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-300 leading-relaxed mt-4"
  >
    <AlertTriangle class="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
    {errorMsg}
  </div>
{/if}
