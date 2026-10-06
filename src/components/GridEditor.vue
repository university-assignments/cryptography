<script setup lang="ts">
import { computed } from 'vue';
import { parseGrid, serializeGrid } from '@/lib/magic-square';

const props = defineProps<{ n: number }>();
const model = defineModel<string>({ required: true });

const cells = computed(() =>
{
	const parsed = parseGrid(model.value, props.n);

	return parsed ?? Array.from({ length: props.n }, () => Array<number | null>(props.n).fill(null));
});

const update = (r: number, c: number, raw: string): void =>
{
	const next = cells.value.map((row) => [ ...row ]);
	const value = Number(raw.trim());

	next[r]![c] = raw.trim() === '' || !Number.isInteger(value)
		? null
		: value;
	model.value = serializeGrid(next);
};
</script>

<template>
	<div
		class="inline-grid gap-1"
		:style="{ gridTemplateColumns: `repeat(${n}, 3rem)` }"
	>
		<template
			v-for="(row, r) in cells"
			:key="r"
		>
			<input
				v-for="(cell, c) in row"
				:key="c"
				type="text"
				inputmode="numeric"
				class="input h-10 px-0 text-center"
				:value="cell ?? ''"
				:aria-label="`a${r + 1}${c + 1}`"
				@input="update(r, c, ($event.target as HTMLInputElement).value)"
			>
		</template>
	</div>
</template>
