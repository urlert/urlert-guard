<script lang="ts">
  import type { DomainClassification } from "$lib/api";
  import { buildOverlaySafetyContext } from "$lib/overlay-types";
  import SafetyStatus from "$lib/components/domain/SafetyStatus.svelte";
  import Identity from "$lib/components/domain/Identity.svelte";
  import RiskList from "$lib/components/domain/RiskList.svelte";
  import Facts from "$lib/components/domain/Facts.svelte";
  import UrlertNote from "$lib/components/domain/UrlertNote.svelte";
  import { ExternalLink } from "@lucide/svelte";

  let {
    classification,
    domain,
  }: {
    classification: DomainClassification;
    domain: string;
  } = $props();

  const ctx = $derived(buildOverlaySafetyContext(classification));
</script>

<div
  class="flex flex-col gap-0 animate-in fade-in slide-in-from-bottom-1 duration-250"
>
  <!-- 1. Bottom line: badge + verdict + trust evidence -->
  <section class="py-0.5">
    <SafetyStatus safetyCtx={ctx} />
  </section>

  <!-- 2. Admin note (shown when present) -->
  {#if classification.admin_note}
    <div class="h-px bg-white/5 my-3"></div>
    <section class="py-0.5">
      <UrlertNote {classification} />
    </section>
  {/if}

  <!-- 3. Who is this site? -->
  {#if classification.identity?.headline || classification.identity?.summary}
    <div class="h-px bg-white/5 my-3"></div>
    <section class="py-0.5">
      <Identity {classification} />
    </section>
  {/if}

  <!-- 4. Risks (compact, expandable) -->
  {#if ctx.risks.length > 0}
    <div class="h-px bg-white/5 my-3"></div>
    <section class="py-0.5">
      <RiskList safetyCtx={ctx} />
    </section>
  {/if}

  <!-- 5. Quick facts -->
  <div class="h-px bg-white/5 my-3"></div>
  <section class="py-0.5">
    <Facts {classification} />
  </section>
</div>
