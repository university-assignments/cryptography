<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
	label: string;
	values: number[];

	/** Размер блока — блоки выделяются дугой сверху, как в тетради. */
	group?: number;
}>();

const groups = computed(() =>
{
	const size = props.group && props.group > 0
		? props.group
		: props.values.length;
	const chunks: number[][] = [];

	for (let i = 0; i < props.values.length; i += size) chunks.push(props.values.slice(i, i + size));

	return chunks;
});

const arcs = computed(() => Boolean(props.group && props.group > 0));
</script>

<template>
	<div class="seq leading-8">
		{{ label }} = (<template
			v-for="(chunk, i) in groups"
			:key="i"
		><span
			class="inline-block whitespace-nowrap"
			:class="arcs ? 'arc' : ''"
		>{{ chunk.join(', ') }}</span><template v-if="i < groups.length - 1">, </template></template>)
	</div>
</template>
