<script setup lang="ts">

/* Пустая клетка (null) подписывается своим именем a₁₃, как на практике. */
defineProps<{ rows: (number | null)[][] }>();
</script>

<template>
	<span class="inline-flex items-stretch align-middle">
		<span class="w-1.5 rounded-l border-y border-l border-current" />
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
						class="text-right"
					>{{ value }}</span>
				</template>
			</template>
		</span>
		<span class="w-1.5 rounded-r border-y border-r border-current" />
	</span>
</template>
