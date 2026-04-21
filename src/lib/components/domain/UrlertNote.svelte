<script lang="ts">
  import type { DomainClassification } from "$lib/api";
  import { marked } from "marked";
  import DOMPurify from "dompurify";
  import { cn } from "$lib/utils";
  import { Separator } from "$lib/components/ui/separator";
  import * as Collapsible from "$lib/components/ui/collapsible";
  import {
    ChevronDown,
    Info,
    TriangleAlert,
    ShieldAlert,
  } from "@lucide/svelte";

  let {
    classification,
  }: {
    classification: DomainClassification;
  } = $props();

  let open = $state(false);

  const note = $derived(classification.admin_note);
  const level = $derived(note?.level || "info");

  // Extract the first heading from the note to use as the trigger subtitle.
  const firstHeading = $derived.by(() => {
    if (!note?.content) return null;
    const match = note.content.match(/^#{1,3}\s+(.+)$/m);
    return match ? match[1].trim() : null;
  });

  const htmlContent = $derived.by(() => {
    if (!note?.content) return "";
    const raw = marked.parse(note.content, { async: false }) as string;
    return DOMPurify.sanitize(raw);
  });

  // Icon mapping
  const NoteIcon = $derived.by(() => {
    switch (level) {
      case "danger":
        return ShieldAlert;
      case "warning":
        return TriangleAlert;
      case "info":
      default:
        return Info;
    }
  });

  // Style mapping based on severity level
  const theme = $derived.by(() => {
    switch (level) {
      case "danger":
        return {
          root: "border border-red-500/20 border-l-red-500 bg-red-950/30",
          trigger: "hover:bg-red-500/10",
          eyebrow: "text-red-400",
          subtitle: "text-red-200/80",
          chevron: "text-red-400/50",
          separator: "bg-red-500/15",
          body: "text-red-200/75",
          blockquote: "border-red-400/50",
        };
      case "warning":
        return {
          root: "border border-amber-500/20 border-l-amber-500 bg-amber-950/20",
          trigger: "hover:bg-amber-500/10",
          eyebrow: "text-amber-500",
          subtitle: "text-amber-200/80",
          chevron: "text-amber-400/50",
          separator: "bg-amber-500/15",
          body: "text-amber-100/75",
          blockquote: "border-amber-400/50",
        };
      case "info":
      default:
        return {
          root: "border border-indigo-500/20 border-l-indigo-500 bg-indigo-950/15",
          trigger: "hover:bg-indigo-500/10",
          eyebrow: "text-indigo-400",
          subtitle: "text-indigo-200/80",
          chevron: "text-indigo-400/50",
          separator: "bg-indigo-500/15",
          body: "text-indigo-100/75",
          blockquote: "border-indigo-400/50",
        };
    }
  });
</script>

{#if note}
  <Collapsible.Root
    bind:open
    class={cn("rounded-lg overflow-hidden border-l-[3px]", theme.root)}
  >
    <!-- Trigger row -->
    <Collapsible.Trigger
      class={cn(
        "w-full flex items-start justify-between gap-3 px-3 py-2.5 text-left transition-colors",
        theme.trigger,
      )}
    >
      <!-- Left: icon + label + subtitle -->
      <div class="flex-1 min-w-0 flex items-start gap-2.5">
        <div class={cn("shrink-0 mt-0.5", theme.eyebrow)}>
          <NoteIcon size={16} />
        </div>
        <div class="min-w-0">
          <p
            class={cn(
              "text-xs font-black uppercase tracking-[0.12em] leading-none mb-1",
              theme.eyebrow,
            )}
          >
            URLert Intelligence Note
          </p>
          {#if firstHeading}
            <p
              class={cn(
                "text-[13px] font-semibold leading-snug",
                theme.subtitle,
              )}
            >
              {firstHeading}
            </p>
          {/if}
        </div>
      </div>

      <!-- Chevron -->
      <ChevronDown
        class={cn(
          "w-4 h-4 shrink-0 mt-1 transition-transform duration-200",
          theme.chevron,
          open && "rotate-180",
        )}
      />
    </Collapsible.Trigger>

    <!-- Collapsible body -->
    <Collapsible.Content>
      <Separator class={theme.separator} />
      <div
        class={cn(
          "px-3.5 pb-3.5 pt-3 text-sm leading-relaxed",
          theme.body,
          "[&_p]:my-1.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
          "[&_ul]:pl-4 [&_ul]:my-1.5 [&_ol]:pl-4 [&_ol]:my-1.5 [&_li]:my-0.5",
          "[&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-semibold",
          "[&_h1]:text-[13px] [&_h2]:text-[13px] [&_h3]:text-[13px]",
          "[&_h1]:mt-2.5 [&_h2]:mt-2.5 [&_h3]:mt-2",
          "[&_strong]:font-semibold",
          "[&_a]:underline [&_a]:opacity-80",
          "[&_blockquote]:border-l-2 [&_blockquote]:pl-2.5 [&_blockquote]:italic [&_blockquote]:opacity-80 [&_blockquote]:my-1.5",
          "[&_code]:bg-white/10 [&_code]:px-1 [&_code]:rounded",
        )}
      >
        <div
          class={cn(
            level === "danger"
              ? "[&_blockquote]:border-red-400/50"
              : level === "warning"
                ? "[&_blockquote]:border-amber-400/50"
                : "[&_blockquote]:border-indigo-400/50",
          )}
        >
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html htmlContent}
        </div>
      </div>
    </Collapsible.Content>
  </Collapsible.Root>
{/if}
