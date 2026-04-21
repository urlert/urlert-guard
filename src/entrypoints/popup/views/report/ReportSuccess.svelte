<script lang="ts">
  import type { ExtensionReportResponse } from "$lib/api";
  import { Button } from "$lib/components/ui/button";
  import { CircleCheck, ExternalLink } from "@lucide/svelte";

  interface Props {
    response: ExtensionReportResponse | null;
    onclose: () => void;
  }

  let { response, onclose }: Props = $props();

  const URLERT_DISCUSS_URL = import.meta.env.DEV
    ? "http://localhost:5175/d"
    : "https://discuss.urlert.com/d";
</script>

<div
  class="flex flex-col items-center justify-center text-center gap-3 py-6 animate-in fade-in duration-200"
>
  <div
    class="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"
  >
    <CircleCheck class="w-7 h-7 text-emerald-400" />
  </div>
  <div>
    <p class="text-base font-semibold text-slate-200">Report Submitted</p>
    <p class="text-sm text-slate-400 mt-1.5 leading-relaxed max-w-[320px]">
      Thank you for helping keep the web safe. Your report has been submitted
      for review.
    </p>
  </div>
  {#if response}
    <a
      href="{URLERT_DISCUSS_URL}/{response.domain}"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-1.5 text-[13px] text-amber-400/80 hover:text-amber-300 transition-colors"
    >
      View on URLert
      <ExternalLink class="w-3.5 h-3.5" />
    </a>
  {/if}
  <Button
    variant="ghost"
    size="sm"
    class="text-sm gap-1.5 text-slate-500 hover:text-slate-300 h-9 w-full mt-2"
    onclick={onclose}
  >
    Done
  </Button>
</div>
