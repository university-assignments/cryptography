<script setup lang="ts">

/* Пустая клетка (null) подписывается своим именем a₁₃, как на практике. */
withDefaults(defineProps<{
	rows: (number | string | null)[][];

	/** Ключи «r,c» выделенных клеток. */
	highlight?: Set<string>;
}>(), { highlight: () => new Set<string>() });
</script>

<template>
	<span class="inline-flex items-stretch align-middle">
		<span class="w-2 rounded-l-[100%] border-l border-current" />
		<span
			class="grid gap-x-3 gap-y-0.5 px-1.5 py-0.5 font-mono text-sm"
			:style="{ gridTemplateColumns: `repeat(${rows[0]?.length ?? 1}, max-content)` }"
		>
			<template
				v-for="(row, r) in rows"
				:key="r"
			>
				<template
					v-for="(value, c) in row"
					:key="c"
				>
					<span
						v-if="value === null"
						class="text-right font-sans"
					>a<sub>{{ r + 1 }}{{ c + 1 }}</sub></span>
					<span
						v-else
						class="rounded text-right"
						:class="highlight.has(`${r},${c}`) ? 'bg-amber-200 font-semibold dark:bg-amber-800' : ''"
					>{{ value }}</span>
				</template>
			</template>
		</span>
		<span class="w-2 rounded-r-[100%] border-r border-current" />
	</span>
</template>
