<script lang="ts">
	import { Tooltip as TooltipPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";
	import TooltipPortal from "./tooltip-portal.svelte";
	import type { ComponentProps } from "svelte";
	import type { WithoutChildrenOrChild } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 0,
		side = "top",
		children,
		arrowClasses,
		portalProps,
		...restProps
	}: TooltipPrimitive.ContentProps & {
		arrowClasses?: string;
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof TooltipPortal>>;
	} = $props();
</script>

<TooltipPortal {...portalProps}>
	<TooltipPrimitive.Content
		bind:ref
		data-slot="tooltip-content"
		{sideOffset}
		{side}
		class={cn(
			"bg-slate-900/95 text-slate-100 backdrop-blur-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-end-2 data-[side=right]:slide-in-from-start-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--bits-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs border border-white/10 shadow-2xl",
			className
		)}
		{...restProps}
	>
		{@render children?.()}
	</TooltipPrimitive.Content>
</TooltipPortal>
