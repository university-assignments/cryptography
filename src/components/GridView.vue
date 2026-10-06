<script setup lang="ts">
withDefaults(defineProps<{
	cells: (string | number | null)[][];

	/** Ключи «r,c» выделенных клеток. */
	highlight?: Set<string>;
	compact?: boolean;

	/** Без рамок — буквы рядами, как в тетради. */
	plain?: boolean;
}>(), { highlight: () => new Set<string>(), compact: false, plain: false });
</script>

<template>
	<div
		class="inline-grid font-mono"
		:class="plain ? 'gap-x-1' : 'gap-px rounded border border-stone-300 bg-stone-300 dark:border-stone-700 dark:bg-stone-700'"
		:style="{ gridTemplateColumns: `repeat(${cells[0]?.length ?? 1}, max-content)` }"
	>
		<template
			v-for="(row, r) in cells"
			:key="r"
		>
			<span
				v-for="(cell, c) in row"
				:key="c"
				class="flex items-center justify-center"
				:class="[
					plain ? 'h-6 min-w-5 text-sm' : 'bg-white dark:bg-stone-900',
					!plain && compact ? 'h-7 min-w-7 px-1 text-xs' : '',
					!plain && !compact ? 'h-9 min-w-9 px-1.5 text-sm' : '',
					highlight.has(`${r},${c}`) ? 'bg-amber-100! font-semibold dark:bg-amber-900/60!' : '',
					cell === null ? 'text-stone-300 dark:text-stone-600' : '',
				]"
			>{{ cell ?? '·' }}</span>
		</template>
	</div>
</template>
