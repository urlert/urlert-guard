<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Radar, LogIn } from "@lucide/svelte";

  interface Props {
    openSignIn: () => void;
  }

  let { openSignIn }: Props = $props();
</script>

<div class="flex flex-col items-center text-center gap-4 py-6">
  <div
    class="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center"
  >
    <Radar class="w-12 h-12 text-indigo-400" />
  </div>
  <div class="space-y-1.5">
    <p class="text-base font-bold text-slate-300">Sign in to scan</p>
    <p class="text-sm text-slate-400 leading-relaxed max-w-[320px]">
      On-demand scanning requires a URLert account. Sign in to send this page
      for AI analysis.
    </p>
  </div>
  <Button
    size="sm"
    class="gap-2 bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 hover:bg-indigo-500/25 hover:text-indigo-200 hover:border-indigo-500/35 shadow-none h-10 px-6 text-sm font-semibold"
    onclick={openSignIn}
  >
    <LogIn class="w-4 h-4" />
    Sign in
  </Button>
</div>
