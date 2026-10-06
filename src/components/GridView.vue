<script setup lang="ts">
withDefaults(defineProps<{
	cells: (string | number | null)[][];

	/** Ключи «r,c» выделенных клеток. */
	highlight?: Set<string>;
	compact?: boolean;
}>(), { highlight: () => new Set<string>(), compact: false });
</script>

<template>
	<div
		class="inline-grid gap-px rounded border border-stone-300 bg-stone-300 font-mono dark:border-stone-700 dark:bg-stone-700"
		:style="{ gridTemplateColumns: `repeat(${cells[0]?.length ?? 1}, max-content)` }"
	>
		<template
			v-for="(row, r) in cells"
			:key="r"
		>
			<span
				v-for="(cell, c) in row"
				:key="c"
				class="flex items-center justify-center bg-white dark:bg-stone-900"
				:class="[
					compact ? 'h-7 min-w-7 px-1 text-xs' : 'h-9 min-w-9 px-1.5 text-sm',
					highlight.has(`${r},${c}`) ? 'bg-amber-100! font-semibold dark:bg-amber-900/60!' : '',
					cell === null ? 'text-stone-300 dark:text-stone-600' : '',
				]"
			>{{ cell ?? '·' }}</span>
		</template>
	</div>
</template>
