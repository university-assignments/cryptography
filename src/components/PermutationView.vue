<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{

	/** output[i] = input[perm[i]], индексы с нуля. */
	perm: number[];
	label?: string;
}>();

const top = computed(() => props.perm.map((_, i) => i + 1));
const bottom = computed(() => props.perm.map((source) => source + 1));
</script>

<template>
	<div class="overflow-x-auto">
		<p
			v-if="label"
			class="hint mb-1"
		>
			{{ label }}
		</p>
		<table class="font-mono text-xs">
			<tbody>
				<tr>
					<td class="pr-2 text-stone-500">
						позиция
					</td>
					<td
						v-for="(value, i) in top"
						:key="i"
						class="px-1 text-center"
					>
						{{ value }}
					</td>
				</tr>
				<tr>
					<td class="pr-2 text-stone-500">
						берём
					</td>
					<td
						v-for="(value, i) in bottom"
						:key="i"
						class="px-1 text-center font-semibold"
					>
						{{ value }}
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>
